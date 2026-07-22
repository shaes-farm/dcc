import type { IsoDateTime, Status } from "./common";
import type { Uri } from "./uri";

/**
 * The Runtime stage (spec §3.0) — what is actually running, normalized across
 * Kubernetes, Vercel, and Cloudflare so one UI serves all three (§6.2).
 */

/**
 * Kinds of running unit. K8s contributes the first four; `function` is a
 * Vercel function and `worker` a Cloudflare worker. Whether CronJobs and Jobs
 * get first-class views in v1 is still open
 * (https://github.com/shaes-farm/dcc/issues/81) — the model carries them
 * either way.
 */
export const WORKLOAD_KINDS = [
  "deployment",
  "statefulset",
  "cronjob",
  "job",
  "function",
  "worker",
] as const;

export type WorkloadKind = (typeof WORKLOAD_KINDS)[number];

/** A running unit, containing pods where the platform has them. */
export interface Workload {
  uri: Uri;
  name: string;
  kind: WorkloadKind;
  /** `env` URI it runs in. */
  environment: Uri;
  /** `service` URI it belongs to, once the resolver matched it (§4.2 step 3). */
  service?: Uri;
  /** K8s namespace; absent for serverless platforms. */
  namespace?: string;
  status: Status;
  /** Ready vs desired replicas. Serverless workloads report neither. */
  readyReplicas?: number;
  desiredReplicas?: number;
  /**
   * Image reference as the platform reports it, e.g.
   * `ghcr.io/acme/checkout:3.7.12@sha256:4bf9…`. This string is the seed of
   * v1 lineage: derived Artifact nodes come from parsing it (§2.2).
   */
  image?: string;
  pods?: Pod[];
}

/**
 * Lifecycle phase, using the Kubernetes vocabulary since that is where pods
 * come from. Distinct from `Status`: phase describes the pod, `Status` is what
 * the UI renders after normalization.
 */
export const POD_PHASES = [
  "pending",
  "running",
  "succeeded",
  "failed",
  "unknown",
] as const;

export type PodPhase = (typeof POD_PHASES)[number];

export interface Pod {
  uri: Uri;
  name: string;
  /** `workload` URI that owns it. */
  workload: Uri;
  environment: Uri;
  namespace?: string;
  phase: PodPhase;
  /** Normalized rollup — `CrashLoopBackOff` surfaces here as `failing`. */
  status: Status;
  ready: boolean;
  /** Highlighted above 3 in the UI; crash-loopers float to the top (§6.2). */
  restarts: number;
  startedAt?: IsoDateTime;
  /** Container image tag actually running. */
  image?: string;
  /** Provider-supplied reason for the current state, e.g. `CrashLoopBackOff`. */
  reason?: string;
}
