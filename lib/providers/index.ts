/**
 * The provider plugin system (spec §2.2, ADR-0002) — the behavioral contracts
 * every integration implements. Concrete vendors are implementations, not
 * features: GitHub is a `GitProvider`, Kubernetes a `DeploymentProvider`.
 *
 * Import from `@/lib/providers`, never a submodule — the per-kind file grouping
 * is organizational. Adapters return normalized `@/lib/domain` types; this
 * layer only adds the filter/query/result payloads those methods carry.
 */

export * from "./provider";
export * from "./capabilities";
export * from "./logs";

export * from "./git/git-provider";
export * from "./deployment/deployment-provider";
export * from "./observability/observability-provider";
export * from "./api/api-provider";
export * from "./artifact/artifact-provider";
export * from "./knowledge/knowledge-provider";
export * from "./issue/issue-provider";
