import { describe, expect, it } from "vitest";

import type { GitHubCredential } from "./auth";
import { GitHubClient, nextPageUrl } from "./client";
import { GitHubError } from "./errors";

const CREDENTIAL: GitHubCredential = {
  token: "ghp_test_value",
  source: "env",
  tokenEnv: "GITHUB_TOKEN",
};

interface Call {
  url: string;
  init: RequestInit | undefined;
}

/**
 * A scripted `fetch`: each queued response answers one call, in order, and the
 * calls are recorded so a test can assert on headers. This is the whole mocking
 * strategy for the GitHub adapter (ADR-0005) — the client takes its `fetch` in
 * the constructor precisely so no interception library is needed.
 */
function scriptedFetch(responses: Response[]) {
  const calls: Call[] = [];
  const remaining = [...responses];

  const fetchImpl = (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    const next = remaining.shift();
    if (!next) throw new Error(`unscripted fetch: ${url}`);
    return Promise.resolve(next);
  };

  return { fetchImpl, calls };
}

function json(
  body: unknown,
  init: { status?: number; headers?: Record<string, string> } = {},
): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "content-type": "application/json", ...init.headers },
  });
}

function client(responses: Response[]) {
  const { fetchImpl, calls } = scriptedFetch(responses);
  return {
    calls,
    github: new GitHubClient({ credential: CREDENTIAL, fetch: fetchImpl }),
  };
}

function headerOf(call: Call, name: string): string | undefined {
  return (call.init?.headers as Record<string, string> | undefined)?.[name];
}

describe("GitHubClient — request shape", () => {
  it("sends bearer auth and the pinned API version", async () => {
    const { github, calls } = client([json({ id: 1 })]);

    await github.rest("/repos/acme/checkout-svc");

    expect(calls[0].url).toBe("https://api.github.com/repos/acme/checkout-svc");
    expect(headerOf(calls[0], "authorization")).toBe("Bearer ghp_test_value");
    expect(headerOf(calls[0], "accept")).toBe("application/vnd.github+json");
    expect(headerOf(calls[0], "x-github-api-version")).toBe("2022-11-28");
  });
});

describe("GitHubClient — conditional requests (ADR-0005)", () => {
  it("sends If-None-Match on the second call and replays the cached body on 304", async () => {
    const { github, calls } = client([
      json({ name: "checkout-svc" }, { headers: { etag: 'W/"abc"' } }),
      new Response(null, { status: 304, headers: { etag: 'W/"abc"' } }),
    ]);

    const first = await github.rest("/repos/acme/checkout-svc");
    const second = await github.rest("/repos/acme/checkout-svc");

    expect(headerOf(calls[0], "if-none-match")).toBeUndefined();
    expect(headerOf(calls[1], "if-none-match")).toBe('W/"abc"');
    // A 304 has no body; the point of the cache is that the caller cannot tell.
    expect(second).toEqual(first);
  });

  it("caches per URL, so one page going stale does not invalidate another", async () => {
    const { github, calls } = client([
      json([{ id: 1 }], { headers: { etag: 'W/"p1"' } }),
      json([{ id: 2 }], { headers: { etag: 'W/"p2"' } }),
      new Response(null, { status: 304, headers: { etag: 'W/"p1"' } }),
    ]);

    await github.rest("/a");
    await github.rest("/b");
    await github.rest("/a");

    expect(headerOf(calls[2], "if-none-match")).toBe('W/"p1"');
  });

  it("does not cache a response GitHub sent without an ETag", async () => {
    const { github, calls } = client([json({ id: 1 }), json({ id: 1 })]);

    await github.rest("/repos/acme/checkout-svc");
    await github.rest("/repos/acme/checkout-svc");

    expect(headerOf(calls[1], "if-none-match")).toBeUndefined();
  });
});

describe("GitHubClient — pagination", () => {
  it("follows Link rel=next and concatenates", async () => {
    const page2 = "https://api.github.com/repos/acme/x/pulls?page=2";
    const { github, calls } = client([
      json([{ id: 1 }], { headers: { link: `<${page2}>; rel="next"` } }),
      json([{ id: 2 }]),
    ]);

    const items = await github.restPages<{ id: number }>("/repos/acme/x/pulls");

    expect(items).toEqual([{ id: 1 }, { id: 2 }]);
    expect(calls[1].url).toBe(page2);
  });

  it("stops at the page cap rather than walking history forever", async () => {
    const selfLink = '<https://api.github.com/next>; rel="next"';
    const { fetchImpl, calls } = scriptedFetch(
      Array.from({ length: 5 }, () =>
        json([{ id: 1 }], { headers: { link: selfLink } }),
      ),
    );
    const github = new GitHubClient({
      credential: CREDENTIAL,
      fetch: fetchImpl,
      maxPages: 3,
    });

    const items = await github.restPages<{ id: number }>("/anything");

    expect(calls).toHaveLength(3);
    expect(items).toHaveLength(3);
  });

  it("rejects a non-list body from a paginated endpoint", async () => {
    const { github } = client([json({ message: "not a list" })]);

    await expect(github.restPages("/repos/acme/x/pulls")).rejects.toThrow(
      /non-list body/,
    );
  });
});

describe("GitHubClient — error messages name the fix (§4.3)", () => {
  it("401 names the env var the credential came from", async () => {
    const { github } = client([
      json({ message: "Bad credentials" }, { status: 401 }),
    ]);

    const error = await github.rest("/user").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(GitHubError);
    expect((error as GitHubError).status).toBe(401);
    expect((error as GitHubError).message).toContain("GITHUB_TOKEN");
  });

  it("401 points at `gh auth login` when the token came from the CLI", async () => {
    const { fetchImpl } = scriptedFetch([json({}, { status: 401 })]);
    const github = new GitHubClient({
      credential: { token: "gho_x", source: "gh-cli" },
      fetch: fetchImpl,
    });

    const error = await github.rest("/user").catch((e: unknown) => e);

    expect((error as GitHubError).message).toContain("gh auth login");
  });

  it("an exhausted rate limit says when it resets and what to turn down", async () => {
    const reset = Math.floor(Date.parse("2026-07-25T12:00:00Z") / 1000);
    const { github } = client([
      json(
        { message: "API rate limit exceeded" },
        {
          status: 403,
          headers: {
            "x-ratelimit-remaining": "0",
            "x-ratelimit-reset": String(reset),
          },
        },
      ),
    ]);

    const error = await github.rest("/repos/acme/x").catch((e: unknown) => e);

    expect((error as GitHubError).status).toBe(429);
    expect((error as GitHubError).message).toContain(
      "2026-07-25T12:00:00.000Z",
    );
    expect((error as GitHubError).message).toContain("pollingSeconds");
  });

  it("a scope 403 names the scope the endpoint needs", async () => {
    const { github } = client([
      json({}, { status: 403, headers: { "x-ratelimit-remaining": "4999" } }),
    ]);

    const error = await github
      .rest("/repos/acme/x/dependabot/alerts")
      .catch((e: unknown) => e);

    expect((error as GitHubError).status).toBe(403);
    expect((error as GitHubError).message).toContain("security_events");
  });

  it("404 points at the config that names the repo", async () => {
    const { github } = client([
      json({ message: "Not Found" }, { status: 404 }),
    ]);

    const error = await github
      .rest("/repos/acme/typo")
      .catch((e: unknown) => e);

    expect((error as GitHubError).status).toBe(404);
    expect((error as GitHubError).message).toContain("dcc.config.json");
  });

  it("maps a 5xx to 502 — the upstream failed, not this request", async () => {
    const { github } = client([json({ message: "boom" }, { status: 503 })]);

    const error = await github.rest("/repos/acme/x").catch((e: unknown) => e);

    expect((error as GitHubError).status).toBe(502);
  });

  it("turns a transport failure into an actionable card, not a bare TypeError", async () => {
    // `fetch` rejects rather than resolving when the request never reaches the
    // host. Verified against a real network cut: without this, the route
    // handler falls through to a generic 500 and the panel says "check the
    // server log", which is the non-actionable card §4.3 rules out.
    const fetchImpl = () => Promise.reject(new TypeError("fetch failed"));
    const github = new GitHubClient({
      credential: CREDENTIAL,
      fetch: fetchImpl,
    });

    const error = await github.rest("/repos/acme/x").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(GitHubError);
    expect((error as GitHubError).status).toBe(503);
    expect((error as GitHubError).message).toContain("api.github.com");
    expect((error as GitHubError).message).toContain("network connection");
    // The original failure is preserved for the server log.
    expect((error as GitHubError).cause).toBeInstanceOf(TypeError);
  });

  it("reports a transport failure on the GraphQL path too", async () => {
    const fetchImpl = () => Promise.reject(new Error("ECONNRESET"));
    const github = new GitHubClient({
      credential: CREDENTIAL,
      fetch: fetchImpl,
    });

    const error = await github.graphql("query {}").catch((e: unknown) => e);

    expect((error as GitHubError).status).toBe(503);
    expect((error as GitHubError).message).toContain("Cannot reach");
  });

  it("never leaks the token into an error", async () => {
    const { github } = client([json({ message: "nope" }, { status: 422 })]);

    const error = await github.rest("/repos/acme/x").catch((e: unknown) => e);

    expect(String((error as Error).message)).not.toContain("ghp_test_value");
  });
});

describe("GitHubClient — rate-limit accounting and retry", () => {
  it("records the last-seen x-ratelimit headers", async () => {
    const reset = Math.floor(Date.parse("2026-07-25T13:00:00Z") / 1000);
    const { github } = client([
      json(
        { id: 1 },
        {
          headers: {
            "x-ratelimit-limit": "5000",
            "x-ratelimit-remaining": "4987",
            "x-ratelimit-reset": String(reset),
          },
        },
      ),
    ]);

    await github.rest("/repos/acme/x");

    expect(github.rateLimit).toEqual({
      limit: 5000,
      remaining: 4987,
      resetAt: "2026-07-25T13:00:00.000Z",
    });
  });

  it("honors a short Retry-After exactly once", async () => {
    const { fetchImpl, calls } = scriptedFetch([
      json({}, { status: 403, headers: { "retry-after": "0" } }),
      json({ id: 1 }),
    ]);
    const github = new GitHubClient({
      credential: CREDENTIAL,
      fetch: fetchImpl,
    });

    await expect(github.rest("/repos/acme/x")).resolves.toEqual({ id: 1 });
    expect(calls).toHaveLength(2);
  });

  it("does not sleep out a long Retry-After — it fails fast for the next poll", async () => {
    const { fetchImpl, calls } = scriptedFetch([
      json(
        { message: "secondary rate limit" },
        { status: 403, headers: { "retry-after": "600" } },
      ),
    ]);
    const github = new GitHubClient({
      credential: CREDENTIAL,
      fetch: fetchImpl,
    });

    await expect(github.rest("/repos/acme/x")).rejects.toThrow(GitHubError);
    expect(calls).toHaveLength(1);
  });
});

describe("GitHubClient — GraphQL", () => {
  it("posts the query and returns data", async () => {
    const { github, calls } = client([
      json({ data: { viewer: { login: "a" } } }),
    ]);

    const result = await github.graphql<{ viewer: { login: string } }>(
      "query { viewer { login } }",
      { n: 1 },
    );

    expect(calls[0].url).toBe("https://api.github.com/graphql");
    expect(JSON.parse(String(calls[0].init?.body))).toEqual({
      query: "query { viewer { login } }",
      variables: { n: 1 },
    });
    expect(result.data.viewer.login).toBe("a");
  });

  it("returns partial data alongside its errors instead of failing (§5.3)", async () => {
    // One unreadable repo must not blank the whole repo panel.
    const { github } = client([
      json({
        data: { r0: { name: "checkout-svc" }, r1: null },
        errors: [
          { type: "NOT_FOUND", message: "Could not resolve to a Repository" },
        ],
      }),
    ]);

    const result = await github.graphql<Record<string, unknown>>("query {}");

    expect(result.data.r0).toEqual({ name: "checkout-svc" });
    expect(result.errors).toHaveLength(1);
  });

  it("treats HTTP 200 with null data as the failure it is", async () => {
    const { github } = client([
      json({
        data: null,
        errors: [{ type: "FORBIDDEN", message: "no access" }],
      }),
    ]);

    const error = await github.graphql("query {}").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(GitHubError);
    expect((error as GitHubError).status).toBe(403);
    expect((error as GitHubError).message).toContain("no access");
  });
});

describe("nextPageUrl", () => {
  it("picks rel=next out of a multi-rel Link header", () => {
    const link =
      '<https://api.github.com/x?page=1>; rel="prev", <https://api.github.com/x?page=3>; rel="next", <https://api.github.com/x?page=9>; rel="last"';

    expect(nextPageUrl(link)).toBe("https://api.github.com/x?page=3");
  });

  it("is undefined on the last page and on no header", () => {
    expect(
      nextPageUrl('<https://api.github.com/x?page=1>; rel="prev"'),
    ).toBeUndefined();
    expect(nextPageUrl(null)).toBeUndefined();
  });
});
