import type { IsoDateTime } from "@/lib/domain";

import type { GitHubCredential } from "./auth";
import { GitHubError } from "./errors";

export const GITHUB_API_BASE = "https://api.github.com";

/** Pinned, so a GitHub REST change is a deliberate bump and not a surprise. */
const API_VERSION = "2022-11-28";

/**
 * A cap, not a page size: a repo with 4,000 closed alerts should degrade to
 * "the first N" rather than spend a polling interval walking history. Each
 * caller asks for the newest page first, so the cap truncates the tail.
 */
const MAX_PAGES = 10;

/**
 * Longest `Retry-After` worth honoring inline. GitHub's secondary limits can
 * ask for a minute; sleeping that long inside a route handler on a 60s poll
 * just stacks requests behind it, so anything longer fails fast with the reset
 * time in the message and lets the next poll try.
 */
const MAX_RETRY_AFTER_MS = 10_000;

/** Injectable `fetch` — the seam every test in this directory uses. */
export type FetchLike = (
  input: string,
  init?: RequestInit,
) => Promise<Response>;

/** Last-seen `x-ratelimit-*`, surfaced by `testConnection` and the audit view. */
export interface RateLimitSnapshot {
  limit?: number;
  remaining?: number;
  resetAt?: IsoDateTime;
}

/** One GraphQL error entry; `type` is GitHub's, e.g. `NOT_FOUND`, `FORBIDDEN`. */
export interface GraphqlError {
  message: string;
  type?: string;
  path?: (string | number)[];
}

/**
 * GraphQL answers partially: an unreadable repository comes back as a `null`
 * alias plus an `errors` entry, with every other alias populated. Returning
 * both lets `listRepos` drop the one repo it cannot see instead of failing the
 * whole panel — §5.3's independent degradation, one level down.
 */
export interface GraphqlResult<T> {
  data: T;
  errors: GraphqlError[];
}

export interface GitHubClientOptions {
  credential: GitHubCredential;
  fetch?: FetchLike;
  baseUrl?: string;
  maxPages?: number;
}

interface CacheEntry {
  etag: string;
  body: unknown;
}

/**
 * The HTTP layer behind the GitHub adapter (ADR-0005): auth, conditional
 * requests, pagination, and rate-limit accounting, over Node's `fetch`.
 *
 * Conditional requests are the load-bearing piece rather than an optimization.
 * A `304` does not count against GitHub's REST quota, so an ETag cache is what
 * makes §6.1's "< 3s on warm cache" and §2.1's 60s git cadence affordable at
 * the same time. The cache lives for the process, which is why the registry
 * memoizes one client per provider instead of building one per request.
 *
 * Nothing here knows about `lib/domain`; normalization is `normalize.ts`.
 */
export class GitHubClient {
  /**
   * A true private field, not `private readonly`: TypeScript's `private` is a
   * compile-time modifier, so the token would still enumerate — and therefore
   * `JSON.stringify` — out of any structure holding a client. `#` makes it
   * structurally absent, which is the guarantee §10.2 actually wants.
   * `registry.test.ts` asserts this.
   */
  readonly #credential: GitHubCredential;
  private readonly fetchImpl: FetchLike;
  private readonly baseUrl: string;
  private readonly maxPages: number;
  private readonly etags = new Map<string, CacheEntry>();
  private rateLimitSnapshot: RateLimitSnapshot = {};

  constructor(options: GitHubClientOptions) {
    this.#credential = options.credential;
    this.fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);
    this.baseUrl = (options.baseUrl ?? GITHUB_API_BASE).replace(/\/$/, "");
    this.maxPages = options.maxPages ?? MAX_PAGES;
  }

  get rateLimit(): RateLimitSnapshot {
    return { ...this.rateLimitSnapshot };
  }

  /** One REST GET, ETag-cached. `path` is absolute-from-root or a full URL. */
  async rest<T>(path: string): Promise<T> {
    const { body } = await this.restResponse<T>(this.resolve(path));
    return body;
  }

  /**
   * Follows `Link` `rel="next"` and concatenates, up to the page cap. Each page
   * URL is cached on its own ETag, so a stable first page stays a 304 even when
   * a later one changes.
   */
  async restPages<T>(path: string): Promise<T[]> {
    const items: T[] = [];
    let url: string | undefined = this.resolve(path);

    for (let page = 0; url && page < this.maxPages; page += 1) {
      const { body, response } = await this.restResponse<T[]>(url);
      // A 304 replays a cached body; a malformed one would mean we cached a
      // non-list response for a list endpoint, which is a programming error.
      if (!Array.isArray(body)) {
        throw new GitHubError(
          `GitHub returned a non-list body for ${url} — expected a paginated array.`,
          { status: 502 },
        );
      }
      items.push(...body);
      url = nextPageUrl(response.headers.get("link"));
    }

    return items;
  }

  /**
   * One `POST /graphql`. GraphQL's failure mode is HTTP 200 with an `errors`
   * array, so a null `data` is the real error signal; partial data comes back
   * with its errors for the caller to weigh.
   */
  async graphql<T>(
    query: string,
    variables: Record<string, unknown> = {},
  ): Promise<GraphqlResult<T>> {
    const url = `${this.baseUrl}/graphql`;
    const response = await this.send(url, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ query, variables }),
    });

    this.recordRateLimit(response);
    if (!response.ok) {
      throw await this.httpError(response, url);
    }

    const payload = (await response.json()) as {
      data?: T | null;
      errors?: GraphqlError[];
    };
    const errors = payload.errors ?? [];

    if (payload.data === null || payload.data === undefined) {
      throw graphqlError(errors, url);
    }

    return { data: payload.data, errors };
  }

  private async restResponse<T>(
    url: string,
  ): Promise<{ body: T; response: Response }> {
    const cached = this.etags.get(url);
    const headers = this.headers();
    if (cached) headers["if-none-match"] = cached.etag;

    const response = await this.send(url, { method: "GET", headers });
    this.recordRateLimit(response);

    if (response.status === 304 && cached) {
      return { body: cached.body as T, response };
    }
    if (!response.ok) {
      throw await this.httpError(response, url);
    }

    const body = (await response.json()) as T;
    const etag = response.headers.get("etag");
    if (etag) this.etags.set(url, { etag, body });

    return { body, response };
  }

  /**
   * The one bounded retry (ADR-0005): a secondary rate limit answers with
   * `Retry-After`, and honoring it once is the difference between a panel that
   * recovers and one that hammers the limit it just hit.
   */
  private async send(url: string, init: RequestInit): Promise<Response> {
    const response = await this.fetchImpl(url, init);
    const retryAfterMs = retryAfter(response);

    if (retryAfterMs !== undefined && retryAfterMs <= MAX_RETRY_AFTER_MS) {
      await sleep(retryAfterMs);
      return this.fetchImpl(url, init);
    }

    return response;
  }

  private headers(): Record<string, string> {
    return {
      authorization: `Bearer ${this.#credential.token}`,
      accept: "application/vnd.github+json",
      "x-github-api-version": API_VERSION,
      "content-type": "application/json",
    };
  }

  private resolve(path: string): string {
    return path.startsWith("http") ? path : `${this.baseUrl}${path}`;
  }

  private recordRateLimit(response: Response): void {
    const limit = numeric(response.headers.get("x-ratelimit-limit"));
    const remaining = numeric(response.headers.get("x-ratelimit-remaining"));
    const reset = numeric(response.headers.get("x-ratelimit-reset"));

    if (limit === undefined && remaining === undefined && reset === undefined) {
      return;
    }
    this.rateLimitSnapshot = {
      limit,
      remaining,
      resetAt: reset === undefined ? undefined : epochToIso(reset),
    };
  }

  /**
   * Turns a non-2xx into the sentence a panel renders. Each branch names the
   * thing to change — the env var, the scope, the reset time — because "403
   * from GitHub" tells an on-call engineer nothing they can act on.
   */
  private async httpError(
    response: Response,
    url: string,
  ): Promise<GitHubError> {
    const detail = await upstreamMessage(response);
    const endpoint = new URL(url).pathname;

    if (response.status === 401) {
      return new GitHubError(`401 from GitHub — ${this.credentialHint()}`, {
        status: 401,
      });
    }

    const remaining = numeric(response.headers.get("x-ratelimit-remaining"));
    if (
      (response.status === 403 || response.status === 429) &&
      remaining === 0
    ) {
      const reset = numeric(response.headers.get("x-ratelimit-reset"));
      const when = reset === undefined ? "shortly" : epochToIso(reset);
      return new GitHubError(
        `GitHub rate limit exhausted — the quota for this credential resets at ${when}. Raise \`ui.pollingSeconds.git\` in dcc.config.json to poll less often.`,
        { status: 429 },
      );
    }

    if (response.status === 403) {
      return new GitHubError(
        `403 from GitHub for ${endpoint} — the credential lacks the scope for this endpoint${scopeHint(endpoint)}.`,
        { status: 403 },
      );
    }

    if (response.status === 404) {
      return new GitHubError(
        `404 from GitHub for ${endpoint} — the repository does not exist, or this credential cannot see it. Check the \`owner\`/\`name\` in dcc.config.json.`,
        { status: 404 },
      );
    }

    return new GitHubError(
      `${response.status} from GitHub for ${endpoint}${detail ? ` — ${detail}` : ""}.`,
      { status: response.status >= 500 ? 502 : response.status },
    );
  }

  private credentialHint(): string {
    if (this.#credential.source === "env" && this.#credential.tokenEnv) {
      return `check ${this.#credential.tokenEnv} in your shell — it is set but GitHub rejected it (expired, revoked, or wrong account).`;
    }
    return "the token from `gh auth token` was rejected. Run `gh auth login` to refresh it.";
  }
}

/** Which scope a 403 on a known endpoint is usually missing. */
function scopeHint(endpoint: string): string {
  if (endpoint.includes("/dependabot/alerts")) {
    return " (Dependabot alerts need `security_events`, or `repo` on a classic token)";
  }
  if (endpoint.includes("/code-scanning/alerts")) {
    return " (code scanning needs `security_events`)";
  }
  if (endpoint.includes("/secret-scanning/alerts")) {
    return " (secret scanning needs `repo` plus the feature enabled on the repository)";
  }
  return "";
}

function graphqlError(errors: GraphqlError[], url: string): GitHubError {
  const first = errors[0];
  const types = new Set(errors.map((error) => error.type));
  const status = types.has("FORBIDDEN")
    ? 403
    : types.has("NOT_FOUND")
      ? 404
      : 502;

  return new GitHubError(
    `GitHub GraphQL returned no data${first ? ` — ${first.message}` : ""}. Endpoint: ${new URL(url).pathname}.`,
    { status },
  );
}

/**
 * The `Link` header's `rel="next"`, or `undefined` on the last page. GitHub
 * returns absolute URLs here, cursor and all, so following them beats
 * reconstructing `?page=`.
 */
export function nextPageUrl(link: string | null): string | undefined {
  if (!link) return undefined;
  for (const part of link.split(",")) {
    const match = /^\s*<([^>]+)>\s*;\s*rel="next"/.exec(part);
    if (match) return match[1];
  }
  return undefined;
}

function retryAfter(response: Response): number | undefined {
  if (response.ok) return undefined;
  const header = response.headers.get("retry-after");
  if (header === null) return undefined;
  const seconds = Number(header);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : undefined;
}

/** GitHub error bodies are `{ message, documentation_url }`; only the first is safe to echo. */
async function upstreamMessage(
  response: Response,
): Promise<string | undefined> {
  try {
    const body = (await response.json()) as { message?: unknown };
    return typeof body.message === "string" ? body.message : undefined;
  } catch {
    return undefined;
  }
}

function numeric(value: string | null): number | undefined {
  if (value === null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function epochToIso(seconds: number): IsoDateTime {
  return new Date(seconds * 1000).toISOString();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
