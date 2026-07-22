/**
 * The §3 vocabulary — the canonical objects every provider normalizes into and
 * every panel renders from.
 *
 * Import from `@/lib/domain`, never from a submodule: the grouping below is
 * organizational, and moving a type between files should not touch call sites.
 *
 * Ordered by the software delivery lifecycle (§3.0):
 * Knowledge → Planning → Source → Build → Artifact → Deploy → Runtime → Observe
 */

export * from "./common";
export * from "./uri";
export * from "./provider";
export * from "./workspace";
export * from "./knowledge";
export * from "./git";
export * from "./build";
export * from "./artifact";
export * from "./deployment";
export * from "./workload";
export * from "./api";
export * from "./observability";
export * from "./action";
