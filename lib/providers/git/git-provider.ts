import type {
  Issue,
  PullRequest,
  Release,
  Repository,
  SecurityAlert,
  Uri,
  WorkflowRun,
} from "@/lib/domain";
import type { ActionResult, ProviderAdapter, Scope } from "../provider";

/**
 * The Source and Planning stages behind a git host (spec §2.2, §3.0). GitHub is
 * the v1 implementation (#11); GitLab and Azure DevOps are later alternate
 * implementations of this same interface, not new features.
 *
 * Every method returns a normalized `lib/domain` type — a GitHub PR payload
 * becomes a `PullRequest` before it leaves the adapter. The two optional
 * methods each map to a `Capability` (`list-issues`, `rerun-workflow`); an
 * implementation that omits one must omit its capability id too.
 */
export interface GitProvider extends ProviderAdapter {
  kind: "git";

  listRepos(): Promise<Repository[]>;
  /** `repo` is a `repo://` URI. */
  listPullRequests(repo: Uri, filter?: PrFilter): Promise<PullRequest[]>;
  listWorkflowRuns(scope: Scope, filter?: RunFilter): Promise<WorkflowRun[]>;
  /** Normalized across every alert source (CodeQL, Dependabot, secret scanning). */
  listAlerts(scope: Scope): Promise<SecurityAlert[]>;
  listReleases(repo: Uri): Promise<Release[]>;

  /** Capability: `list-issues`. Issues-as-planning; a full tracker is an `IssueProvider` (§1.3). */
  listIssues?(repo: Uri): Promise<Issue[]>;
  /** Capability: `rerun-workflow`. Safe action (§7.1). `run` is a `run://` URI. */
  rerunWorkflow?(run: Uri): Promise<ActionResult>;
}

/** Server-side filter for `listPullRequests`. Omitted fields mean "no constraint". */
export interface PrFilter {
  state?: PullRequest["state"];
  /** Filter to PRs authored by this login. */
  author?: string;
  targetBranch?: string;
}

/** Server-side filter for `listWorkflowRuns`. */
export interface RunFilter {
  branch?: string;
  /**
   * Restrict to runs the UI treats as this normalized status — e.g. `failing`
   * for "every failed run across every repo" (§6.1). Uses the shared
   * vocabulary, never an upstream conclusion string.
   */
  status?: WorkflowRun["status"];
  /** Cap the number of runs returned, newest first. */
  limit?: number;
}
