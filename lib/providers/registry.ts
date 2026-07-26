import { loadConfig } from "@/lib/config/load";
import type { DccConfig, ProviderConfig } from "@/lib/config/schema";

import type { GitProvider } from "./git/git-provider";
import { resolveGitHubToken, tokenEnvName } from "./git/github/auth";
import { GitHubClient } from "./git/github/client";
import { GitHubError } from "./git/github/errors";
import { GitHubGitProvider } from "./git/github/github-git-provider";
import type { RepoCoords } from "./git/github/normalize";

/**
 * Turns `dcc.config.json` into live adapters (§4.1 → §2.2).
 *
 * **Server-only.** This module resolves credentials, so it must never be
 * reachable from a client component — which is why it is absent from
 * `lib/providers/index.ts` (a type-only barrel the UI does import) and why
 * `eslint.config.mjs` forbids `components/**` and `app/**` pages from importing
 * it. Route handlers are the only callers.
 *
 * Adapters are memoized for the process, not built per request: the client's
 * ETag cache (ADR-0005) is what makes §6.1's warm-cache criterion reachable,
 * and a fresh client every poll would have an empty one.
 */
const cache = new Map<string, Promise<GitProvider>>();

/** Which vendors this build can construct; `kind` is an open string in §4.1. */
const GIT_IMPLEMENTATIONS = ["github"] as const;

/**
 * The `GitProvider` for a configured provider id, or the only configured one
 * when `id` is omitted — the common case, since a workspace normally has one
 * git host.
 */
export async function getGitProvider(id?: string): Promise<GitProvider> {
  const config = loadConfig();
  const entry = selectGitProvider(config, id);
  const key = entry.id;

  const existing = cache.get(key);
  if (existing) return existing;

  const created = buildGitProvider(entry, config).catch((error: unknown) => {
    // A failed build must not be cached: the usual cause is a missing token,
    // and exporting it should fix the next request rather than need a restart.
    cache.delete(key);
    throw error;
  });
  cache.set(key, created);
  return created;
}

/** Drops the memoized adapters. Exported for tests and a future config watcher. */
export function resetProviderRegistry(): void {
  cache.clear();
}

function selectGitProvider(
  config: DccConfig,
  id: string | undefined,
): ProviderConfig {
  const entries = config.providers?.git ?? [];

  if (entries.length === 0) {
    throw new GitHubError(
      "No git provider configured — add one to `providers.git` in dcc.config.json.",
      { status: 501 },
    );
  }

  if (id === undefined) {
    if (entries.length === 1) return entries[0];
    throw new GitHubError(
      `dcc.config.json configures ${entries.length} git providers (${entries
        .map((entry) => entry.id)
        .join(", ")}); name one with ?provider=<id>.`,
      { status: 400 },
    );
  }

  const match = entries.find((entry) => entry.id === id);
  if (match) return match;

  throw new GitHubError(
    `No git provider "${id}" in dcc.config.json — configured ids are ${entries
      .map((entry) => entry.id)
      .join(", ")}.`,
    { status: 404 },
  );
}

async function buildGitProvider(
  entry: ProviderConfig,
  config: DccConfig,
): Promise<GitProvider> {
  if (!(GIT_IMPLEMENTATIONS as readonly string[]).includes(entry.kind)) {
    throw new GitHubError(
      `Git provider "${entry.id}" has kind "${entry.kind}", which this build cannot serve — supported kinds: ${GIT_IMPLEMENTATIONS.join(", ")}.`,
      { status: 501 },
    );
  }

  const credential = await resolveGitHubToken(entry);

  return new GitHubGitProvider({
    id: entry.id,
    label: entry.label,
    tokenEnv: tokenEnvName(entry),
    repositories: repoCoordsFor(config, entry.id),
    client: new GitHubClient({ credential }),
  });
}

/**
 * The repositories bound to this provider (§4.1 `repositories[].provider`).
 * Reference integrity already guarantees the id resolves, so a filter is
 * enough — no dangling-reference handling needed here.
 */
function repoCoordsFor(config: DccConfig, providerId: string): RepoCoords[] {
  return (config.repositories ?? [])
    .filter((repo) => repo.provider === providerId)
    .map((repo) => ({
      provider: providerId,
      owner: repo.owner,
      name: repo.name,
      id: repo.id,
      tags: repo.tags ?? [],
    }));
}
