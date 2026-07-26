import { describe, expect, it } from "vitest";

import { REVIEW_STATES, SEVERITIES, STATUSES } from "@/lib/domain";

import {
  ADVISORY_SEVERITY,
  ALERT_STATE,
  CHECK_ROLLUP,
  PR_STATE,
  REVIEW_DECISION,
  RULE_SEVERITY,
  RUN_CONCLUSION,
  RUN_STATUS,
  alertState,
  mergeable,
  reviewState,
  runStatus,
  toStatus,
} from "./status";

/**
 * §2.2 requires the mapping rules to be documented in code. These tests assert
 * the *key sets*, not just a sample: a GitHub value nobody mapped shows up here
 * as a missing key rather than as a silent `unknown` in a panel.
 */
describe("mapping tables cover GitHub's vocabularies", () => {
  it("covers every workflow_run.status GitHub documents", () => {
    expect(Object.keys(RUN_STATUS).sort()).toEqual(
      [
        "completed",
        "in_progress",
        "pending",
        "queued",
        "requested",
        "waiting",
      ].sort(),
    );
  });

  it("covers every workflow_run.conclusion GitHub documents", () => {
    expect(Object.keys(RUN_CONCLUSION).sort()).toEqual(
      [
        "action_required",
        "cancelled",
        "failure",
        "neutral",
        "skipped",
        "stale",
        "startup_failure",
        "success",
        "timed_out",
      ].sort(),
    );
  });

  it("covers every GraphQL StatusState", () => {
    expect(Object.keys(CHECK_ROLLUP).sort()).toEqual(
      ["ERROR", "EXPECTED", "FAILURE", "PENDING", "SUCCESS"].sort(),
    );
  });

  it("only ever produces members of the shared vocabularies", () => {
    for (const status of [
      ...Object.values(RUN_STATUS),
      ...Object.values(RUN_CONCLUSION),
      ...Object.values(CHECK_ROLLUP),
    ]) {
      expect(STATUSES).toContain(status);
    }
    for (const severity of [
      ...Object.values(ADVISORY_SEVERITY),
      ...Object.values(RULE_SEVERITY),
    ]) {
      expect(SEVERITIES).toContain(severity);
    }
    for (const review of Object.values(REVIEW_DECISION)) {
      expect(REVIEW_STATES).toContain(review);
    }
  });

  it("maps GitHub's three PR states and nothing else", () => {
    expect(PR_STATE).toEqual({
      OPEN: "open",
      MERGED: "merged",
      CLOSED: "closed",
    });
  });

  it("collapses all four upstream spellings of a closed alert", () => {
    expect(ALERT_STATE.auto_dismissed).toBe("dismissed");
    expect(ALERT_STATE.closed).toBe("fixed");
    expect(ALERT_STATE.resolved).toBe("fixed");
    expect(ALERT_STATE.fixed).toBe("fixed");
  });
});

describe("never guess healthy (§2.2)", () => {
  it("maps every inconclusive conclusion to unknown, not healthy", () => {
    for (const conclusion of ["cancelled", "skipped", "neutral", "stale"]) {
      expect(RUN_CONCLUSION[conclusion]).toBe("unknown");
    }
  });

  it("maps an unrecognized value to unknown rather than defaulting up", () => {
    expect(toStatus(RUN_CONCLUSION, "some_new_github_conclusion")).toBe(
      "unknown",
    );
    expect(toStatus(CHECK_ROLLUP, null)).toBe("unknown");
    expect(toStatus(CHECK_ROLLUP, undefined)).toBe("unknown");
  });

  it("treats a check that was announced but never reported as unknown", () => {
    expect(CHECK_ROLLUP.EXPECTED).toBe("unknown");
  });
});

describe("runStatus", () => {
  it("prefers the conclusion once there is one", () => {
    expect(runStatus("completed", "failure")).toBe("failing");
    expect(runStatus("completed", "success")).toBe("healthy");
  });

  it("uses the lifecycle phase while the run is in flight", () => {
    expect(runStatus("in_progress", null)).toBe("deploying");
    expect(runStatus("queued", null)).toBe("deploying");
  });

  it("is unknown for completed-with-no-conclusion, GitHub's transient state", () => {
    expect(runStatus("completed", null)).toBe("unknown");
  });

  it("treats a stopped-for-approval run as degraded, not failing", () => {
    expect(runStatus("completed", "action_required")).toBe("degraded");
  });
});

describe("reviewState, alertState, mergeable", () => {
  it("maps a null review decision to none — nobody is required", () => {
    expect(reviewState(null)).toBe("none");
    expect(reviewState("APPROVED")).toBe("approved");
    expect(reviewState("CHANGES_REQUESTED")).toBe("changes-requested");
    expect(reviewState("REVIEW_REQUIRED")).toBe("review-required");
  });

  it("shows an unclassifiable alert rather than hiding it", () => {
    expect(alertState("something_new")).toBe("open");
    expect(alertState(undefined)).toBe("open");
  });

  it("maps GitHub's still-computing mergeability to absent, not false", () => {
    expect(mergeable("MERGEABLE")).toBe(true);
    expect(mergeable("CONFLICTING")).toBe(false);
    expect(mergeable("UNKNOWN")).toBeUndefined();
    expect(mergeable(null)).toBeUndefined();
  });
});
