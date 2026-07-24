import type {
  Deployment,
  Environment,
  IsoDateTime,
  Uri,
  Workload,
} from "@/lib/domain";
import type { LogPage } from "../logs";
import type { ActionResult, ProviderAdapter } from "../provider";

/**
 * The Deploy and Runtime stages (spec §2.2, §3.0). Kubernetes is the v1
 * implementation; Vercel and Cloudflare are alternate implementations behind
 * the same interface, which is what lets one UI (§6.2) serve all three.
 *
 * This is where the normalized status vocabulary is load-bearing: every
 * upstream state collapses to `healthy | degraded | failing | deploying |
 * unknown` before it leaves the adapter (K8s `CrashLoopBackOff` → `failing`,
 * Vercel `BUILDING` → `deploying`, missing metrics → `unknown`, never guessed
 * `healthy`). The two optional methods map to `restart-workload` and
 * `trigger-deploy`.
 */
export interface DeploymentProvider extends ProviderAdapter {
  kind: "deployment";

  /** Rollup per environment for the env grid (§6.2). */
  listEnvironments(): Promise<Environment[]>;
  /** `env` is an `env://` URI; returns the environment plus what runs in it. */
  getEnvironment(env: Uri): Promise<EnvironmentDetail>;
  /** `w` is a `workload://` URI. `Workload` already carries normalized `status`. */
  getWorkloadStatus(w: Uri): Promise<Workload>;
  getRecentDeploys(env: Uri): Promise<Deployment[]>;
  /** `w` is a `workload://` or `pod://` URI. */
  getLogs(w: Uri, opts: LogQuery): Promise<LogPage>;

  /** Capability: `restart-workload`. Safe action (§7.1). */
  restartWorkload?(w: Uri): Promise<ActionResult>;
  /** Capability: `trigger-deploy`. Safe action (§7.1); `prod-like` tiers force typed-name confirm. */
  triggerDeploy?(env: Uri, opts?: DeployOptions): Promise<ActionResult>;
}

/**
 * An `Environment` plus its running contents — the payload `getEnvironment`
 * returns, distinct from the bare `Environment` rollup `listEnvironments`
 * returns. This is the one genuine composite this layer adds (ADR-0002):
 * §2.2's `EnvDetail` has no domain equivalent because pods hang off workloads,
 * not off the environment, in the domain model.
 */
export interface EnvironmentDetail {
  environment: Environment;
  /** Everything running here; each `Workload` carries its own `pods` where the platform has them. */
  workloads: Workload[];
}

/** Log-tail parameters for `getLogs`. */
export interface LogQuery {
  /** Only lines at or after this instant. */
  since?: IsoDateTime;
  /** Max lines to return. */
  limit?: number;
  /** Opaque continuation token from a prior `LogPage.nextCursor`. */
  cursor?: string;
  /** Substring/selector to narrow the tail, provider-native. */
  filter?: string;
}

/** Options for `triggerDeploy`. */
export interface DeployOptions {
  /** Version or tag to roll out; the adapter's default (e.g. latest) applies when absent. */
  version?: string;
  /** Commit SHA to deploy, when the target selects by commit rather than tag. */
  commitSha?: string;
}
