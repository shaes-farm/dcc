import type {
  ReviewState,
  SecurityAlert,
  Severity,
  Status,
} from "@/lib/domain";

/**
 * Every mapping from a GitHub vocabulary onto a DCC one, in one file.
 *
 * §2.2 requires this: "Mapping rules must be documented in code (e.g., K8s
 * `CrashLoopBackOff` → `failing`; Vercel `BUILDING` → `deploying`; missing
 * metrics → `unknown`, **never guess `healthy`**)." They are exported `const`
 * maps rather than inline `switch`es so tests can assert the whole key set —
 * a GitHub conclusion nobody mapped should be a visible gap in a table, not a
 * silent `unknown` buried in a default branch.
 *
 * The rule the tables encode: absence and ambiguity are `unknown`. A cancelled
 * run did not pass, a skipped one did not run, and neither is `healthy`.
 */

/**
 * `workflow_run.status` — the run's lifecycle phase. Anything not yet finished
 * is `deploying`, which is the vocabulary's "work in flight" member (§2.2 uses
 * it for Vercel's `BUILDING`).
 */
export const RUN_STATUS: Record<string, Status> = {
  queued: "deploying",
  in_progress: "deploying",
  waiting: "deploying",
  requested: "deploying",
  pending: "deploying",
  completed: "unknown", // Resolved by the conclusion below, never on its own.
};

/**
 * `workflow_run.conclusion` — how a completed run ended.
 *
 * `action_required` is `degraded` rather than `failing`: the run stopped for a
 * human (a required approval), which is a different thing from a broken build
 * and reads differently on a status badge. `cancelled`, `skipped`, `neutral`
 * and `stale` are `unknown` because none of them is evidence the code is good.
 */
export const RUN_CONCLUSION: Record<string, Status> = {
  success: "healthy",
  failure: "failing",
  timed_out: "failing",
  startup_failure: "failing",
  action_required: "degraded",
  cancelled: "unknown",
  skipped: "unknown",
  neutral: "unknown",
  stale: "unknown",
};

/**
 * GraphQL `StatusState` — the aggregate check rollup on a commit or PR.
 * `EXPECTED` means a check was announced but has not reported, which is not
 * yet a pass.
 */
export const CHECK_ROLLUP: Record<string, Status> = {
  SUCCESS: "healthy",
  FAILURE: "failing",
  ERROR: "failing",
  PENDING: "deploying",
  EXPECTED: "unknown",
};

/** GraphQL `PullRequestReviewDecision`; `null` means nobody is required. */
export const REVIEW_DECISION: Record<string, ReviewState> = {
  APPROVED: "approved",
  CHANGES_REQUESTED: "changes-requested",
  REVIEW_REQUIRED: "review-required",
};

/** GraphQL `PullRequestState`; DCC spells the same three states in lower case. */
export const PR_STATE: Record<string, "open" | "merged" | "closed"> = {
  OPEN: "open",
  MERGED: "merged",
  CLOSED: "closed",
};

/**
 * Dependabot's `security_advisory.severity` and code scanning's
 * `security_severity_level` share GitHub's four-level scale, which maps
 * straight onto the top four of `SEVERITIES`.
 */
export const ADVISORY_SEVERITY: Record<string, Severity> = {
  critical: "critical",
  high: "high",
  medium: "medium",
  moderate: "medium", // Dependabot's spelling for the same level.
  low: "low",
};

/**
 * Code scanning's `rule.severity` — the lint-style scale, used only when the
 * richer `security_severity_level` is absent (it is, for non-security rules).
 */
export const RULE_SEVERITY: Record<string, Severity> = {
  error: "high",
  warning: "medium",
  note: "low",
  none: "info",
};

/**
 * Secret scanning reports no severity at all — every alert is "a credential is
 * in the repository". `Severity` has no `unknown` member to fall back to, so
 * this is a deliberate, documented choice rather than a mapping: a live secret
 * is treated as `high`, which sorts it above the median Dependabot finding
 * without claiming it outranks a critical RCE.
 */
export const SECRET_SCANNING_SEVERITY: Severity = "high";

/**
 * Alert lifecycle across the three sources, which spell the same three states
 * four different ways. `auto_dismissed` is Dependabot closing its own alert;
 * `closed` and `resolved` are code scanning's and secret scanning's "dealt
 * with", which the domain calls `fixed`.
 */
export const ALERT_STATE: Record<string, SecurityAlert["state"]> = {
  open: "open",
  dismissed: "dismissed",
  auto_dismissed: "dismissed",
  fixed: "fixed",
  closed: "fixed",
  resolved: "fixed",
};

/**
 * Reads a mapping table, defaulting to `unknown` rather than guessing. Every
 * lookup in `normalize.ts` goes through one of these so the never-guess rule
 * holds by construction instead of by review.
 */
export function toStatus(
  table: Record<string, Status>,
  value: string | null | undefined,
): Status {
  if (!value) return "unknown";
  return table[value] ?? "unknown";
}

/**
 * A run's normalized status: the conclusion when it has one, the lifecycle
 * phase while it does not. `completed` with no conclusion is a transient GitHub
 * state and lands on `unknown`, which is the honest answer.
 */
export function runStatus(
  status: string | null | undefined,
  conclusion: string | null | undefined,
): Status {
  if (conclusion) return toStatus(RUN_CONCLUSION, conclusion);
  return toStatus(RUN_STATUS, status);
}

export function reviewState(decision: string | null | undefined): ReviewState {
  if (!decision) return "none";
  return REVIEW_DECISION[decision] ?? "none";
}

export function alertState(
  state: string | null | undefined,
): SecurityAlert["state"] {
  // An unrecognized state is treated as open: an alert nobody can classify is
  // one an engineer should still see in the rollup.
  if (!state) return "open";
  return ALERT_STATE[state] ?? "open";
}

/**
 * GraphQL `mergeable`: `MERGEABLE` / `CONFLICTING` / `UNKNOWN`. The third is
 * GitHub still computing, so it maps to `undefined` — the domain's optional
 * field — rather than to `false`, which would render as "has conflicts".
 */
export function mergeable(
  value: string | null | undefined,
): boolean | undefined {
  if (value === "MERGEABLE") return true;
  if (value === "CONFLICTING") return false;
  return undefined;
}
