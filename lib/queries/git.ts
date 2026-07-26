import { queryOptions } from "@tanstack/react-query";

import type {
  PullRequest,
  Repository,
  SecurityAlert,
  Status,
  Uri,
  WorkflowRun,
} from "@/lib/domain";
import type { PrFilter, RunFilter, Scope } from "@/lib/providers";

/**
 * Server state for the git surface — the client half of `/api/git/*`.
 *
 * Zustand holds client/UI state and TanStack Query holds server state; nothing
 * fetched here goes into the store. Panels call these `queryOptions` and render
 * from the result, which is what lets a panel keep showing yesterday's data
 * with an honest "as of" stamp instead of blanking on every refetch (§8).
 *
 * Per-domain polling lives on the individual queries, as `app/providers.tsx`
 * says it should — the `QueryClient` defaults only encode what is true of every
 * query in the app.
 */

/**
 * §2.1's cadence. `git` is configurable via `ui.pollingSeconds.git` (§4.1);
 * §2.1 additionally wants security alerts every 5 minutes, and the config has
 * no key for that yet, so it is a constant here rather than a widened schema.
 */
export const GIT_POLL_MS = 60_000;
export const SECURITY_POLL_MS = 300_000;

/**
 * The key factory. Keys are hierarchical so a future "refresh all git panels"
 * can invalidate `gitKeys.all` and hit everything below it, and every key holds
 * URIs — never an ad-hoc object shape (§3.2).
 */
export const gitKeys = {
  all: ["git"] as const,
  repos: () => [...gitKeys.all, "repos"] as const,
  prs: (repo: Uri, filter?: PrFilter) =>
    [...gitKeys.all, "prs", repo, filter ?? null] as const,
  runs: (scope: Scope, filter?: RunFilter) =>
    [...gitKeys.all, "runs", scope, filter ?? null] as const,
  alerts: (scope: Scope) => [...gitKeys.all, "alerts", scope] as const,
  releases: (repo: Uri) => [...gitKeys.all, "releases", repo] as const,
};

/**
 * Which panels a git failure takes down with it. CLAUDE.md's bar for a
 * degraded state is that the card names the env var to fix *and* says which
 * panels go stale until it is — this is the second half, kept next to the
 * queries that define the blast radius rather than restated in each panel.
 */
export const GIT_DEPENDENT_PANELS =
  "Repos, PRs and Security stay stale until this is fixed.";

export function reposQuery() {
  return queryOptions({
    queryKey: gitKeys.repos(),
    queryFn: () => fetchJson<Repository[]>("/api/git/repos"),
    refetchInterval: GIT_POLL_MS,
  });
}

export function pullRequestsQuery(repo: Uri, filter?: PrFilter) {
  return queryOptions({
    queryKey: gitKeys.prs(repo, filter),
    queryFn: () =>
      fetchJson<PullRequest[]>(`/api/git/prs?${params({ repo, ...filter })}`),
    refetchInterval: GIT_POLL_MS,
  });
}

export function workflowRunsQuery(scope: Scope, filter?: RunFilter) {
  return queryOptions({
    queryKey: gitKeys.runs(scope, filter),
    queryFn: () =>
      fetchJson<WorkflowRun[]>(`/api/git/runs?${params({ scope, ...filter })}`),
    refetchInterval: GIT_POLL_MS,
  });
}

export function alertsQuery(scope: Scope) {
  return queryOptions({
    queryKey: gitKeys.alerts(scope),
    queryFn: () =>
      fetchJson<SecurityAlert[]>(`/api/git/alerts?${params({ scope })}`),
    refetchInterval: SECURITY_POLL_MS,
  });
}

/** Query-string builder that drops absent filter fields. */
function params(
  values: Record<string, string | number | Status | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) search.set(key, String(value));
  }
  return search.toString();
}

/**
 * Unwraps the route handlers' `{ error: { message } }` into a thrown `Error`
 * whose message is the sentence the provider authored. That string travels
 * unchanged from `lib/providers` to the panel's `ErrorCard`, which is the whole
 * point of authoring it at the layer that knows what broke.
 */
async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    throw new Error(
      body?.error?.message ??
        `${response.status} from ${url} — DCC's own API failed, not GitHub.`,
    );
  }

  return (await response.json()) as T;
}
