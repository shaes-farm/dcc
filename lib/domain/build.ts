import type { Actor, CommitRef, IsoDateTime, Status } from "./common";
import type { Uri } from "./uri";

/**
 * The Build stage (spec §3.0): consumes a commit, produces artifacts.
 *
 * GitHub Actions in v1; CircleCI, Jenkins, Buildkite, and GitLab CI are later
 * implementations of the same shape. This is the node that answers "which
 * workflow produced this image?" and "which workflow failed?" — the hinge of
 * the lineage strip (§5.2).
 */
export interface WorkflowRun {
  uri: Uri;
  /** `repo` URI the run belongs to. */
  repo: Uri;
  /** Provider-assigned run id, e.g. `9182734`. */
  id: string;
  /** Workflow name as declared upstream, e.g. "CI". */
  name: string;
  /** Human run number, e.g. 1842 — what "Build #1842" refers to. */
  runNumber?: number;
  /** The commit this run consumed. Lineage matches on its SHA. */
  commit: CommitRef;
  branch?: string;
  /**
   * Normalized (§2.2): a queued or in-progress run is `deploying`, a passing
   * run `healthy`, a failed one `failing`. The upstream state is not exposed.
   */
  status: Status;
  /** Upstream conclusion string, kept for display only — never switched on. */
  conclusion?: string;
  startedAt: IsoDateTime;
  completedAt?: IsoDateTime;
  durationMs?: number;
  /** Who triggered it. */
  actor?: Actor;
  /** `pr` URI when the run was triggered by a pull request. */
  pullRequest?: Uri;
  /** `artifact` URIs this run published, once resolved. */
  producedArtifacts: Uri[];
  url: string;
}
