import type { Artifact, Uri } from "@/lib/domain";
import type { ProviderAdapter, Scope } from "../provider";

/**
 * Package and container registries (spec §2.2, §3.1) — GHCR/GitHub Packages
 * first, then Docker Hub, ECR/ACR/GAR, Artifactory, Harbor, npm, NuGet. They
 * all expose the same concepts, so one interface covers them.
 *
 * No registry adapter is required for v1: `Artifact` nodes are *derived* by
 * parsing the image reference on a running workload and matching it to the CI
 * run and commit that produced it (§2.2). A registry adapter later enriches
 * those same nodes with version history and provenance — no model change, so
 * §2.2's `ArtifactRef` is just the domain `Artifact` (ADR-0002). No optional
 * methods, so no capabilities of its own.
 */
export interface ArtifactProvider extends ProviderAdapter {
  kind: "artifact";

  listArtifacts(scope: Scope): Promise<Artifact[]>;
  /** `a` is an `artifact://` URI. */
  getArtifact(a: Uri): Promise<Artifact>;
  /** Links a running workload's image back to its registry entry; `null` when unmatched. */
  resolveByDigest(digest: string): Promise<Artifact | null>;
}
