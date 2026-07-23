import type { Actor, CommitRef, IsoDateTime } from "./common";
import type { Uri } from "./uri";

/**
 * The Artifact stage (spec §3.0) — the bridge between engineering and
 * operations. Repositories produce artifacts; deployments consume them. A
 * deployment does not produce a container, and modeling it that way is what
 * keeps the supply chain walkable in both directions.
 */

/** Registry families an artifact can come from (§3.1). */
export const ARTIFACT_KINDS = [
  "oci",
  "npm",
  "nuget",
  "maven",
  "pypi",
  "helm",
  "deb",
  "terraform",
] as const;

export type ArtifactKind = (typeof ARTIFACT_KINDS)[number];

/**
 * Supply-chain attestation attached to an artifact — SBOM documents, SLSA
 * provenance. Deliberately open: registries expose wildly different shapes,
 * and how much of this DCC renders is still open
 * (https://github.com/shaes-farm/dcc/issues/90).
 *
 * Not to be confused with *edge* provenance in the Knowledge Graph
 * (`declared | inferred | telemetry | knowledge`, §3.3), which answers "why do
 * you think these two things are related?" and lives in `lib/graph`.
 */
export interface ArtifactProvenance {
  /** SLSA build level, when attested. */
  slsaLevel?: number;
  attestations?: Array<{
    /** in-toto predicate type URI, e.g. `https://slsa.dev/provenance/v1`. */
    predicateType: string;
    url?: string;
    /** Whether DCC verified the signature, as opposed to merely reading it. */
    verified?: boolean;
  }>;
  sbom?: {
    /** `spdx` or `cyclonedx`. */
    format: string;
    url?: string;
  };
}

/**
 * A published, versioned build output: OCI image, npm/NuGet/Maven/PyPI
 * package, Helm chart, Debian package, Terraform module.
 *
 * **Most fields are optional by design.** No registry implementation is
 * required for v1 lineage (§2.2): an Artifact node is *derived* from the image
 * reference on a running workload, so it starts as little more than a name, a
 * tag, and a digest. Source and build linkage appear when SHA/tag matching
 * succeeds; publication metadata and provenance appear only once an
 * `ArtifactProvider` is configured, enriching the same node without a model
 * change.
 */
export interface Artifact {
  uri: Uri;
  /** Registry-qualified name, e.g. `ghcr.io/acme/checkout`, `@acme/ui-kit`. */
  id: string;
  kind: ArtifactKind;
  /** The version this instance represents, e.g. `3.7.12`. */
  version: string;
  /** Every tag pointing at this version; a version may carry none. */
  tags: string[];
  /** Content digest, e.g. `sha256:4bf9…`. Absent for registries without one. */
  digest?: string;
  /** Registry-only: unknown for artifacts derived from a running image. */
  publishedAt?: IsoDateTime;
  /** Registry-only: who or what published it. */
  publisher?: Actor;
  /** `repo` URI that produced it, when source linkage resolved. */
  sourceRepo?: Uri;
  /** The commit built into it — the SHA that makes lineage matchable. */
  sourceCommit?: CommitRef;
  /** `run` URI of the build that published it. */
  producingRun?: Uri;
  provenance?: ArtifactProvenance;
}
