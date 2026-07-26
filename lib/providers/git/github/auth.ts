import { execFile } from "node:child_process";
import { promisify } from "node:util";

import type { ProviderConfig } from "@/lib/config/schema";

import { GitHubError } from "./errors";

const execFileAsync = promisify(execFile);

/**
 * `gh auth token` is a local keychain read; if it has not answered in this long
 * the CLI is wedged, and waiting further just stalls a panel that has a token
 * path available.
 */
const GH_TIMEOUT_MS = 5_000;

/**
 * A resolved credential. `source` and `tokenEnv` exist so the Settings row and
 * error messages can say *how* DCC authenticated; the value itself is carried
 * only to the client that sets the header, and is never logged, serialized, or
 * attached to an error (§10.2).
 */
export interface GitHubCredential {
  token: string;
  source: "gh-cli" | "env";
  /** Env-var *name* the token came from; absent when `gh` supplied it. */
  tokenEnv?: string;
}

export interface ResolveTokenOptions {
  /**
   * Reads `gh auth token`, resolving `null` when the CLI is absent, wedged, or
   * unauthenticated. Injected by tests; there is no other seam, since the real
   * one shells out.
   */
  readGhToken?: () => Promise<string | null>;
  env?: Record<string, string | undefined>;
}

/**
 * The env vars tried when `auth: "gh-cli"` is declared but `gh` produces
 * nothing. §4.1's schema rejects `auth` and `tokenEnv` on the same entry, so a
 * gh-cli provider has no *declared* token to fall back to — and the issue still
 * requires that a missing `gh` degrade to the token path rather than fail.
 *
 * These two names, in this order, are exactly what the `gh` CLI itself reads
 * before its keychain, so DCC authenticates with whatever `gh` would have. It
 * is inference, not configuration (§4.2): declaring `auth: { tokenEnv }`
 * overrides it.
 */
const GH_CLI_FALLBACK_ENV = ["GH_TOKEN", "GITHUB_TOKEN"] as const;

/**
 * §6.1's auth resolution order: `gh auth token` when `auth: "gh-cli"`, else
 * `tokenEnv`.
 *
 * The `gh` CLI is an optional accelerator, not a hard dependency, so every way
 * it can fail to produce a token — not installed, not on `PATH`, not logged in,
 * hung — falls through to the token path rather than failing the provider. Only
 * exhausting *every* path is an error, and that error names the fixes.
 */
export async function resolveGitHubToken(
  provider: ProviderConfig,
  options: ResolveTokenOptions = {},
): Promise<GitHubCredential> {
  const { readGhToken = readGhTokenFromCli, env = process.env } = options;
  const tokenEnv = tokenEnvName(provider);

  if (provider.auth === "gh-cli") {
    const token = await readGhToken();
    if (token) return { token, source: "gh-cli" };

    for (const name of GH_CLI_FALLBACK_ENV) {
      const fallback = env[name]?.trim();
      if (fallback) return { token: fallback, source: "env", tokenEnv: name };
    }
  }

  if (tokenEnv) {
    const token = env[tokenEnv]?.trim();
    if (token) return { token, source: "env", tokenEnv };
  }

  throw new GitHubError(credentialMissingMessage(provider, tokenEnv), {
    status: 401,
  });
}

/**
 * The env-var *name* a provider entry declares. §4.1 accepts two shapes —
 * `auth: { tokenEnv }` and a bare top-level `tokenEnv` — and the schema already
 * rejects declaring both, so reading either here is unambiguous.
 */
export function tokenEnvName(provider: ProviderConfig): string | undefined {
  if (typeof provider.auth === "object") return provider.auth.tokenEnv;
  return provider.tokenEnv;
}

function credentialMissingMessage(
  provider: ProviderConfig,
  tokenEnv: string | undefined,
): string {
  if (provider.auth === "gh-cli") {
    return `No GitHub credential — \`gh auth token\` returned nothing and neither ${GH_CLI_FALLBACK_ENV.join(" nor ")} is set in this shell. Run \`gh auth login\`, or export ${GH_CLI_FALLBACK_ENV[1]}.`;
  }
  if (tokenEnv) {
    return `${tokenEnv} is not set in this shell — export it, or set \`auth: "gh-cli"\` on provider "${provider.id}" in dcc.config.json and run \`gh auth login\`.`;
  }
  return `Provider "${provider.id}" declares no credential — add \`auth: "gh-cli"\` or \`auth: { "tokenEnv": "GITHUB_TOKEN" }\` to it in dcc.config.json.`;
}

/**
 * Every failure mode is swallowed deliberately: a missing binary throws
 * `ENOENT`, an unauthenticated CLI exits non-zero, and a wedged one hits the
 * timeout. All three mean "no token from `gh`", which is a fallback, not a
 * fault. Nothing from the child process is logged — its stdout is the token.
 */
async function readGhTokenFromCli(): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync("gh", ["auth", "token"], {
      timeout: GH_TIMEOUT_MS,
      windowsHide: true,
    });
    const token = stdout.trim();
    return token === "" ? null : token;
  } catch {
    return null;
  }
}
