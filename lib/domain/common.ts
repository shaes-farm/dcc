/**
 * Primitives shared across every canonical object (spec §3.1).
 *
 * Nothing here is domain-specific — these are the small shapes that would
 * otherwise be redeclared in a dozen files and drift apart.
 */

/**
 * The normalized status vocabulary (§2.2). Every deployment, observability,
 * and CI provider collapses its own states into these five, and the UI renders
 * nothing else — no `CrashLoopBackOff`, no `BUILDING`, no `succeeded`.
 *
 * Mapping rules live with each provider, but one rule is global: missing data
 * is `unknown`. Never guess `healthy`.
 */
export const STATUSES = [
  "healthy",
  "degraded",
  "failing",
  "deploying",
  "unknown",
] as const;

export type Status = (typeof STATUSES)[number];

/**
 * Severity for security alerts and anything else ranked worst-first (§6.1).
 * Ordered high to low, so array index doubles as sort weight.
 */
export const SEVERITIES = [
  "critical",
  "high",
  "medium",
  "low",
  "info",
] as const;

export type Severity = (typeof SEVERITIES)[number];

/**
 * An ISO-8601 instant, e.g. `2026-07-21T14:32:05Z`.
 *
 * Deliberately a string rather than a `Date`: these objects are serialized
 * across the route-handler boundary (§2) and cached by TanStack Query, so a
 * `Date` would need re-hydrating on every fetch. Parse at the point of
 * formatting instead.
 */
export type IsoDateTime = string;

/** A human who did something — merged a PR, published an artifact, deployed. */
export interface Actor {
  /** Provider-scoped handle, e.g. a GitHub login. */
  login: string;
  /** Display name, when the provider exposes one. */
  name?: string;
  avatarUrl?: string;
  /** Profile URL on the upstream provider. */
  url?: string;
}

/**
 * A commit, as referenced from a run, deployment, artifact, or PR. Not a
 * canonical object of its own — commits are always reached through something
 * else, and carrying the SHA is what makes lineage matching possible (§5.2).
 */
export interface CommitRef {
  sha: string;
  /** Abbreviated SHA for display; providers may omit it. */
  shortSha?: string;
  /** First line of the commit message. */
  message?: string;
  author?: Actor;
  committedAt?: IsoDateTime;
  /** Upstream URL for the commit. */
  url?: string;
}
