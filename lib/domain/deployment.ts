import type { Actor, CommitRef, IsoDateTime, Status } from "./common";
import type { Uri } from "./uri";

/**
 * The Deploy stage (spec §3.0): a rollout of a service into an environment,
 * consuming an artifact.
 */

/**
 * How much care an environment demands (§4.1). Environments default to
 * `shared`; `prod-like` must be opted into per environment and activates
 * typed-name confirmation on every action against it (§7.1, §10.6).
 */
export const ENVIRONMENT_TIERS = ["sandbox", "shared", "prod-like"] as const;

export type EnvironmentTier = (typeof ENVIRONMENT_TIERS)[number];

/** A deployment target: dev, qa, staging, previews, edge. */
export interface Environment {
  uri: Uri;
  /** Config-declared id, unique within the workspace. */
  id: string;
  /** Display label, e.g. "Vercel Previews". */
  label: string;
  /** `Provider` id backing this environment. */
  provider: string;
  tier: EnvironmentTier;
  /** Worst-of rollup across everything running here (§6.2 panel 1). */
  status: Status;
  /** K8s namespaces in scope, for Kubernetes-backed environments. */
  namespaces?: string[];
  /** When the most recent deployment into this environment landed. */
  lastDeployAt?: IsoDateTime;
}

/** A rollout event — service into environment, at a version, by someone. */
export interface Deployment {
  uri: Uri;
  /** `service` URI being rolled out. */
  service: Uri;
  /** `env` URI being rolled out into. */
  environment: Uri;
  /** Version string as the provider reports it, e.g. `3.7.12`. */
  version?: string;
  /** The commit deployed. The lineage strip matches on this SHA (§5.2). */
  commit?: CommitRef;
  /** `artifact` URI this rollout consumed, once resolved. */
  artifact?: Uri;
  /** Normalized (§2.2): an in-flight rollout is `deploying`. */
  status: Status;
  /** Who or what triggered it. */
  actor?: Actor;
  startedAt: IsoDateTime;
  finishedAt?: IsoDateTime;
  /** Provider URL for the rollout, where one exists. */
  url?: string;
}
