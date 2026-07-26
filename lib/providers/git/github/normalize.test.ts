import { describe, expect, it } from "vitest";

import {
  parseUri,
  SEVERITIES,
  type Issue,
  type PullRequest,
  type Release,
  type Repository,
  type SecurityAlert,
  type WorkflowRun,
} from "@/lib/domain";

import {
  CHECKOUT_COORDS,
  CODE_SCANNING_ALERT,
  CODE_SCANNING_ALERT_QUALITY,
  DEPENDABOT_ALERT,
  ISSUE,
  PULL_REQUEST_NODE,
  PULL_REQUEST_NODE_MERGED,
  RELEASE,
  REPO_NODE,
  REPO_NODE_DEGRADED,
  SECRET_SCANNING_ALERT,
  STOREFRONT_COORDS,
  WORKFLOW_RUN,
  WORKFLOW_RUN_IN_PROGRESS,
} from "./github.fixtures";
import {
  toCodeScanningAlert,
  toDependabotAlert,
  toIssue,
  toPullRequest,
  toRelease,
  toRepository,
  toSecretScanningAlert,
  toWorkflowRun,
} from "./normalize";

describe("toRepository", () => {
  it("normalizes a repo rollup into the domain shape", () => {
    const repo = toRepository(REPO_NODE, CHECKOUT_COORDS) satisfies Repository;

    expect(repo).toEqual({
      uri: "repo://github/acme/checkout-svc",
      id: "checkout-svc",
      owner: "acme",
      name: "checkout-svc",
      provider: "github",
      defaultBranch: "main",
      tags: ["service"],
      description: "Checkout and payments service",
      archived: false,
      url: "https://github.com/acme/checkout-svc",
      status: "healthy",
      lastCommit: {
        sha: "a1b2c3d4e5f60718293a4b5c6d7e8f9012345678",
        shortSha: "a1b2c3d",
        message: "Extract pricing client",
        author: {
          login: "alice",
          name: "Alice Chen",
          avatarUrl: "https://avatars.githubusercontent.com/u/1",
          url: "https://github.com/alice",
        },
        committedAt: "2026-07-24T18:02:11Z",
        url: "https://github.com/acme/checkout-svc/commit/a1b2c3d4e5f60718293a4b5c6d7e8f9012345678",
      },
      openPullRequestCount: 3,
      openAlertCount: 2,
    });
  });

  it("leaves openAlertCount absent when the credential cannot read alerts", () => {
    // "We did not look" and "we looked and found none" are different answers;
    // rendering 0 for the first is the guess §2.2 forbids.
    const repo = toRepository(REPO_NODE_DEGRADED, STOREFRONT_COORDS);

    expect(repo.openAlertCount).toBeUndefined();
    expect(repo.status).toBe("failing");
  });

  it("keeps a bot commit's author absent rather than inventing one", () => {
    const repo = toRepository(REPO_NODE_DEGRADED, STOREFRONT_COORDS);

    expect(repo.lastCommit?.sha).toBe(
      "9f8e7d6c5b4a39281706f5e4d3c2b1a098765432",
    );
    expect(repo.lastCommit?.author).toBeUndefined();
  });
});

describe("toPullRequest", () => {
  it("normalizes an open PR, including the check rollup and review decision", () => {
    const pr = toPullRequest(
      PULL_REQUEST_NODE,
      CHECKOUT_COORDS,
    ) satisfies PullRequest;

    expect(pr.uri).toBe("pr://github/acme/checkout-svc/482");
    expect(pr.repo).toBe("repo://github/acme/checkout-svc");
    expect(pr.state).toBe("open");
    expect(pr.checks).toBe("healthy");
    expect(pr.review).toBe("approved");
    expect(pr.mergeable).toBe(true);
    expect(pr.author?.login).toBe("alice");
  });

  it("maps an unreported rollup to unknown and UNKNOWN mergeability to absent", () => {
    const pr = toPullRequest(PULL_REQUEST_NODE_MERGED, CHECKOUT_COORDS);

    expect(pr.state).toBe("merged");
    expect(pr.checks).toBe("unknown");
    expect(pr.review).toBe("none");
    // Not `false`: GitHub is still computing, and false renders as "conflicts".
    expect(pr.mergeable).toBeUndefined();
    expect(pr.mergeCommit?.shortSha).toBe("c0ffee1");
    expect(pr.mergedAt).toBe("2026-07-12T16:20:00Z");
  });
});

describe("toWorkflowRun", () => {
  it("normalizes a finished run and derives its duration", () => {
    const run = toWorkflowRun(
      WORKFLOW_RUN,
      CHECKOUT_COORDS,
    ) satisfies WorkflowRun;

    expect(run.uri).toBe("run://github/acme/checkout-svc/9182734");
    expect(run.status).toBe("healthy");
    // Kept verbatim for display; never switched on (lib/domain/build.ts).
    expect(run.conclusion).toBe("success");
    expect(run.startedAt).toBe("2026-07-24T18:02:30Z");
    expect(run.completedAt).toBe("2026-07-24T18:06:12Z");
    expect(run.durationMs).toBe(222_000);
    expect(run.pullRequest).toBe("pr://github/acme/checkout-svc/482");
    expect(run.commit.message).toBe("Extract pricing client");
    expect(run.actor?.login).toBe("alice");
  });

  it("leaves a running run without a completion time or duration", () => {
    const run = toWorkflowRun(WORKFLOW_RUN_IN_PROGRESS, CHECKOUT_COORDS);

    expect(run.status).toBe("deploying");
    expect(run.conclusion).toBeUndefined();
    expect(run.completedAt).toBeUndefined();
    expect(run.durationMs).toBeUndefined();
    expect(run.pullRequest).toBeUndefined();
  });
});

describe("security alerts merge into one shape (§6.1 panel 4)", () => {
  it("normalizes a Dependabot alert", () => {
    const alert = toDependabotAlert(
      DEPENDABOT_ALERT,
      CHECKOUT_COORDS,
    ) satisfies SecurityAlert;

    expect(alert.source).toBe("dependabot");
    expect(alert.severity).toBe("high");
    expect(alert.title).toBe("tar-fs path traversal");
    expect(alert.path).toBe("package-lock.json");
    expect(alert.state).toBe("open");
  });

  it("prefers the security severity scale over the lint one", () => {
    expect(
      toCodeScanningAlert(CODE_SCANNING_ALERT, CHECKOUT_COORDS).severity,
    ).toBe("critical");
  });

  it("falls back to the lint scale for a non-security rule", () => {
    const alert = toCodeScanningAlert(
      CODE_SCANNING_ALERT_QUALITY,
      CHECKOUT_COORDS,
    );

    expect(alert.severity).toBe("low");
    expect(alert.state).toBe("dismissed");
  });

  it("gives secret scanning the documented severity it has no field for", () => {
    const alert = toSecretScanningAlert(SECRET_SCANNING_ALERT, CHECKOUT_COORDS);

    expect(alert.source).toBe("secret-scanning");
    expect(alert.severity).toBe("high");
    expect(alert.title).toBe("Stripe API Key committed to the repository");
  });

  it("qualifies every alert URI with its repository (ADR-0006)", () => {
    // GitHub numbers alerts per repo, so the bare number in §3.2's example
    // collides across the workspace the rollup merges.
    const here = toDependabotAlert(DEPENDABOT_ALERT, CHECKOUT_COORDS);
    const there = toDependabotAlert(DEPENDABOT_ALERT, STOREFRONT_COORDS);

    expect(here.uri).not.toBe(there.uri);
    expect(here.uri).toBe("alert://github/dependabot/acme%2Fcheckout-svc%2F42");

    const parsed = parseUri(here.uri);
    expect(parsed).toEqual({
      scheme: "alert",
      provider: "github",
      source: "dependabot",
      id: "acme/checkout-svc/42",
    });
  });

  it("uses the domain's source vocabulary, so the rollup can sort by severity", () => {
    const alerts = [
      toSecretScanningAlert(SECRET_SCANNING_ALERT, CHECKOUT_COORDS),
      toCodeScanningAlert(CODE_SCANNING_ALERT, CHECKOUT_COORDS),
      toCodeScanningAlert(CODE_SCANNING_ALERT_QUALITY, CHECKOUT_COORDS),
    ].sort(
      (a, b) => SEVERITIES.indexOf(a.severity) - SEVERITIES.indexOf(b.severity),
    );

    expect(alerts.map((alert) => alert.severity)).toEqual([
      "critical",
      "high",
      "low",
    ]);
    expect(alerts.map((alert) => alert.source)).toEqual([
      "code-scanning",
      "secret-scanning",
      "code-scanning",
    ]);
  });
});

describe("toRelease and toIssue", () => {
  it("references a release by repo and tag — it has no URI (§3.2)", () => {
    const release = toRelease(RELEASE, CHECKOUT_COORDS) satisfies Release;

    expect(release).toEqual({
      repo: "repo://github/acme/checkout-svc",
      tag: "v3.7.12",
      name: "3.7.12",
      prerelease: false,
      publishedAt: "2026-07-18T12:00:00Z",
      author: {
        login: "alice",
        name: undefined,
        avatarUrl: "https://avatars.githubusercontent.com/u/1",
        url: "https://github.com/alice",
      },
      body: "### Fixed\n- Retry idempotency keys",
      url: "https://github.com/acme/checkout-svc/releases/tag/v3.7.12",
    });
    expect("uri" in release).toBe(false);
  });

  it("flattens issue labels and assignees to the strings the domain wants", () => {
    const issue = toIssue(ISSUE, CHECKOUT_COORDS) satisfies Issue;

    expect(issue.labels).toEqual(["bug", "p1"]);
    expect(issue.assignees).toEqual(["alice"]);
    expect(issue.repo).toBe("repo://github/acme/checkout-svc");
    expect(issue.closedAt).toBeUndefined();
  });
});
