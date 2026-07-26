import {
  SEVERITIES,
  parseUri,
  type Issue,
  type ParsedUriOf,
  type PullRequest,
  type Release,
  type Repository,
  type SecurityAlert,
  type Status,
  type Uri,
  type WorkflowRun,
} from "@/lib/domain";

import type {
  ActionResult,
  Capability,
  ConnectionResult,
  Scope,
} from "../../provider";
import type { GitProvider, PrFilter, RunFilter } from "../git-provider";
import type { GitHubClient } from "./client";
import { GitHubError } from "./errors";
import {
  toCodeScanningAlert,
  toDependabotAlert,
  toIssue,
  toPullRequest,
  toRelease,
  toRepository,
  toSecretScanningAlert,
  toWorkflowRun,
  type RepoCoords,
  type RestCodeScanningAlert,
  type RestDependabotAlert,
  type RestIssue,
  type RestRelease,
  type RestSecretScanningAlert,
  type RestWorkflowRun,
} from "./normalize";
import {
  PULL_REQUESTS_QUERY,
  prStateFilter,
  repoQuery,
  repoVariables,
  type PullRequestNode,
  type RepoNode,
} from "./queries";

/** Newest-first page size for list endpoints that have no natural bound. */
const DEFAULT_PAGE_SIZE = 50;

export interface GitHubGitProviderOptions {
  /** Config `providers.git[]` id — the first segment of every URI minted. */
  id: string;
  label?: string;
  /** Env-var *name*, carried for the Settings row; never the value (§10.2). */
  tokenEnv?: string;
  /** The workspace's repositories (§4.1) — config declares them, not the API. */
  repositories: RepoCoords[];
  client: GitHubClient;
}

/**
 * The v1 `GitProvider` (§2.2, §6.1, #11) — the one real provider in the Phase 0
 * vertical slice, and therefore the thing that proves the interfaces against a
 * real API rather than against a fake.
 *
 * Two rules from `lib/providers/README.md` hold in every method: nothing
 * upstream-shaped leaves here (normalization is `normalize.ts`), and the
 * optional methods are exactly the ones `capabilities()` declares.
 *
 * The workspace is the set of repositories `dcc.config.json` declares (§4.1),
 * not everything the credential can see — so `listRepos` reads config and asks
 * GitHub about those, and a workspace-scoped query fans out across them.
 */
export class GitHubGitProvider implements GitProvider {
  readonly kind = "git" as const;
  readonly implementation = "github";
  readonly id: string;
  readonly label?: string;
  readonly tokenEnv?: string;
  /**
   * `unknown` until something has actually talked to GitHub (§3.1). It is not
   * mutated by list calls: the Settings row's answer comes from
   * `testConnection()`, which is the probe that actually knows.
   */
  readonly status: Status = "unknown";

  private readonly repositories: RepoCoords[];
  private readonly client: GitHubClient;

  constructor(options: GitHubGitProviderOptions) {
    this.id = options.id;
    this.label = options.label;
    this.tokenEnv = options.tokenEnv;
    this.repositories = options.repositories;
    this.client = options.client;
  }

  capabilities(): Capability[] {
    // Both optional methods are implemented below. Adding an id here without
    // the method is what `providers.test.ts` reflection-checks against.
    return ["list-issues", "rerun-workflow"];
  }

  async testConnection(): Promise<ConnectionResult> {
    const startedAt = Date.now();
    try {
      // The cheapest authenticated call GitHub has, and it never 403s on scope.
      await this.client.rest("/rate_limit");
      return {
        ok: true,
        status: "healthy",
        checkedAt: new Date().toISOString(),
        latencyMs: Date.now() - startedAt,
        message: this.rateLimitMessage(),
      };
    } catch (error) {
      return {
        ok: false,
        // `unknown`, not `failing`: the probe did not complete, which is not the
        // same as GitHub being down (§2.2).
        status: "unknown",
        checkedAt: new Date().toISOString(),
        latencyMs: Date.now() - startedAt,
        message:
          error instanceof Error ? error.message : "GitHub is unreachable.",
      };
    }
  }

  /**
   * One GraphQL round trip for every configured repository. A repo the
   * credential cannot see comes back `null` and is dropped — §5.3's
   * independent degradation, one level down from the panel: one bad line in
   * dcc.config.json costs one card, not the grid.
   */
  async listRepos(): Promise<Repository[]> {
    if (this.repositories.length === 0) return [];

    const { data } = await this.client.graphql<Record<string, RepoNode | null>>(
      repoQuery(this.repositories.length),
      repoVariables(this.repositories),
    );

    return this.repositories
      .map((coords, index) => {
        const node = data[`r${index}`];
        return node ? toRepository(node, coords) : null;
      })
      .filter((repo): repo is Repository => repo !== null);
  }

  async listPullRequests(repo: Uri, filter?: PrFilter): Promise<PullRequest[]> {
    const coords = this.coordsFor(repo);
    const { data } = await this.client.graphql<{
      repository: { pullRequests: { nodes: PullRequestNode[] } } | null;
    }>(PULL_REQUESTS_QUERY, {
      owner: coords.owner,
      name: coords.name,
      first: DEFAULT_PAGE_SIZE,
      states: prStateFilter(filter?.state),
      baseRefName: filter?.targetBranch ?? null,
    });

    const nodes = data.repository?.pullRequests.nodes ?? [];
    const prs = nodes.map((node) => toPullRequest(node, coords));

    // `author` has no GraphQL argument on this connection, so it post-filters —
    // free, since the author is already selected for the PR row.
    return filter?.author
      ? prs.filter((pr) => pr.author?.login === filter.author)
      : prs;
  }

  async listWorkflowRuns(
    scope: Scope,
    filter?: RunFilter,
  ): Promise<WorkflowRun[]> {
    const limit = filter?.limit ?? DEFAULT_PAGE_SIZE;
    const query = new URLSearchParams({
      per_page: String(Math.min(limit, 100)),
    });
    if (filter?.branch) query.set("branch", filter.branch);

    const perRepo = await Promise.all(
      this.scopeRepos(scope).map(async (coords) => {
        const body = await this.client.rest<{
          workflow_runs?: RestWorkflowRun[];
        }>(
          `/repos/${coords.owner}/${coords.name}/actions/runs?${query.toString()}`,
        );
        return (body.workflow_runs ?? []).map((run) =>
          toWorkflowRun(run, coords),
        );
      }),
    );

    const runs = perRepo
      .flat()
      // Newest first, so the cap below truncates history rather than today.
      .sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt));

    // Filters on the *normalized* status, not an upstream conclusion string:
    // GitHub has no parameter for "everything the UI calls failing" (§6.1's
    // "every failed workflow run across every repository").
    const matching = filter?.status
      ? runs.filter((run) => run.status === filter.status)
      : runs;

    return matching.slice(0, limit);
  }

  /**
   * §6.1 panel 4: Dependabot, code scanning and secret scanning merged into one
   * severity-sorted table.
   *
   * A source that 403s or 404s for a repository — the feature is off, or the
   * token lacks `security_events` — contributes nothing instead of failing the
   * array. Merging is the entire point of the method, so losing one source must
   * not cost the other two.
   */
  async listAlerts(scope: Scope): Promise<SecurityAlert[]> {
    const perRepo = await Promise.all(
      this.scopeRepos(scope).map(async (coords) => {
        const [dependabot, codeScanning, secretScanning] = await Promise.all([
          this.optionalAlerts<RestDependabotAlert>(coords, "dependabot/alerts"),
          this.optionalAlerts<RestCodeScanningAlert>(
            coords,
            "code-scanning/alerts",
          ),
          this.optionalAlerts<RestSecretScanningAlert>(
            coords,
            "secret-scanning/alerts",
          ),
        ]);

        return [
          ...dependabot.map((alert) => toDependabotAlert(alert, coords)),
          ...codeScanning.map((alert) => toCodeScanningAlert(alert, coords)),
          ...secretScanning.map((alert) =>
            toSecretScanningAlert(alert, coords),
          ),
        ];
      }),
    );

    // `SEVERITIES` is ordered worst-first, so its index is the sort weight
    // (lib/domain/common.ts).
    return perRepo
      .flat()
      .sort(
        (a, b) =>
          SEVERITIES.indexOf(a.severity) - SEVERITIES.indexOf(b.severity),
      );
  }

  async listReleases(repo: Uri): Promise<Release[]> {
    const coords = this.coordsFor(repo);
    const releases = await this.client.restPages<RestRelease>(
      `/repos/${coords.owner}/${coords.name}/releases?per_page=${DEFAULT_PAGE_SIZE}`,
    );
    return releases.map((release) => toRelease(release, coords));
  }

  /** Capability: `list-issues`. */
  async listIssues(repo: Uri): Promise<Issue[]> {
    const coords = this.coordsFor(repo);
    const issues = await this.client.restPages<RestIssue>(
      `/repos/${coords.owner}/${coords.name}/issues?state=open&per_page=${DEFAULT_PAGE_SIZE}`,
    );
    // `GET /issues` returns pull requests too; §3.1 keeps them separate objects.
    return issues
      .filter((issue) => issue.pull_request === undefined)
      .map((issue) => toIssue(issue, coords));
  }

  /**
   * Capability: `rerun-workflow`. A safe action (§7.1) — it re-runs failed jobs
   * rather than mutating anything. The confirmation dialog and the audit entry
   * belong to the action framework behind `/api/actions/*`; this only reports
   * what GitHub said so that UX can close.
   */
  async rerunWorkflow(run: Uri): Promise<ActionResult> {
    const parsed = parseUri(run);
    if (parsed.scheme !== "run") {
      throw new GitHubError(
        `rerunWorkflow needs a run:// URI, got ${parsed.scheme}://.`,
        { status: 400 },
      );
    }

    const at = new Date().toISOString();
    try {
      await this.client.rest(
        `/repos/${parsed.owner}/${parsed.repo}/actions/runs/${parsed.runId}/rerun-failed-jobs`,
      );
      return { ok: true, at, targetUri: run, message: "Re-run queued." };
    } catch (error) {
      return {
        ok: false,
        at,
        targetUri: run,
        message: error instanceof Error ? error.message : "Re-run failed.",
      };
    }
  }

  /**
   * A `Scope` is either one object's URI or the literal `"workspace"` — the
   * latter meaning every configured repository, which is what makes §6.1's
   * cross-repo questions ("what's red in CI anywhere") one query.
   */
  private scopeRepos(scope: Scope): RepoCoords[] {
    if (scope === "workspace") return this.repositories;
    return [this.coordsFor(scope)];
  }

  /**
   * Config is the source of truth for a repo's id and tags, so a URI is
   * resolved back to its configured entry rather than re-derived. A URI naming
   * a repo nobody configured is a 404 with the fix in it.
   */
  private coordsFor(uri: Uri): RepoCoords {
    const parsed = parseUri(uri);
    if (parsed.scheme !== "repo") {
      throw new GitHubError(
        `Expected a repo:// URI, got ${parsed.scheme}://.`,
        { status: 400 },
      );
    }

    const { owner, name } = parsed as ParsedUriOf<"repo">;
    const match = this.repositories.find(
      (repo) => repo.owner === owner && repo.name === name,
    );
    if (match) return match;

    throw new GitHubError(
      `${owner}/${name} is not in dcc.config.json — add it to \`repositories\` to query it.`,
      { status: 404 },
    );
  }

  /**
   * A per-repo alert source that is allowed to be absent. 403 is "no
   * `security_events` scope", 404 is "the feature is not enabled on this
   * repository"; neither is a reason to blank the merged table.
   */
  private async optionalAlerts<T>(
    coords: RepoCoords,
    path: string,
  ): Promise<T[]> {
    try {
      return await this.client.restPages<T>(
        `/repos/${coords.owner}/${coords.name}/${path}?state=open&per_page=${DEFAULT_PAGE_SIZE}`,
      );
    } catch (error) {
      if (
        error instanceof GitHubError &&
        (error.status === 403 || error.status === 404)
      ) {
        return [];
      }
      throw error;
    }
  }

  private rateLimitMessage(): string | undefined {
    const { remaining, limit } = this.client.rateLimit;
    if (remaining === undefined || limit === undefined) return undefined;
    return `${remaining} of ${limit} requests remaining this hour.`;
  }
}
