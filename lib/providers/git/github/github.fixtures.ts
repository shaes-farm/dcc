import type { PullRequestNode, RepoNode } from "./queries";
import type {
  RepoCoords,
  RestCodeScanningAlert,
  RestDependabotAlert,
  RestIssue,
  RestRelease,
  RestSecretScanningAlert,
  RestWorkflowRun,
} from "./normalize";

/**
 * Recorded GitHub payloads, trimmed to the fields the adapter reads.
 *
 * Imported by tests only; nothing here ships, and it is deliberately absent
 * from every barrel — the same arrangement as `lib/domain/uri.fixtures.ts`, and
 * for the same reason: one set of examples that the normalizer tests and the
 * provider tests both use, so the two cannot drift.
 *
 * These are shapes GitHub actually returns, including the awkward ones: a
 * `null` author on a bot-pushed commit, a `null` `security_severity_level` on a
 * non-security CodeQL rule, and an "issue" that is really a pull request.
 */

export const CHECKOUT_COORDS: RepoCoords = {
  provider: "github",
  owner: "acme",
  name: "checkout-svc",
  id: "checkout-svc",
  tags: ["service"],
};

export const STOREFRONT_COORDS: RepoCoords = {
  provider: "github",
  owner: "acme",
  name: "storefront",
  id: "storefront",
  tags: ["app", "nextjs"],
};

export const REPO_NODE: RepoNode = {
  name: "checkout-svc",
  owner: { login: "acme" },
  description: "Checkout and payments service",
  isArchived: false,
  url: "https://github.com/acme/checkout-svc",
  defaultBranchRef: {
    name: "main",
    target: {
      oid: "a1b2c3d4e5f60718293a4b5c6d7e8f9012345678",
      abbreviatedOid: "a1b2c3d",
      messageHeadline: "Extract pricing client",
      committedDate: "2026-07-24T18:02:11Z",
      commitUrl:
        "https://github.com/acme/checkout-svc/commit/a1b2c3d4e5f60718293a4b5c6d7e8f9012345678",
      author: {
        name: "Alice Chen",
        user: {
          login: "alice",
          avatarUrl: "https://avatars.githubusercontent.com/u/1",
          url: "https://github.com/alice",
        },
      },
      statusCheckRollup: { state: "SUCCESS" },
    },
  },
  pullRequests: { totalCount: 3 },
  vulnerabilityAlerts: { totalCount: 2 },
};

/** A repo whose credential cannot read security alerts, and whose CI is red. */
export const REPO_NODE_DEGRADED: RepoNode = {
  ...REPO_NODE,
  name: "storefront",
  url: "https://github.com/acme/storefront",
  description: null,
  defaultBranchRef: {
    name: "main",
    target: {
      oid: "9f8e7d6c5b4a39281706f5e4d3c2b1a098765432",
      abbreviatedOid: "9f8e7d6",
      messageHeadline: "Bump next to 16.2.11",
      committedDate: "2026-07-25T08:41:00Z",
      commitUrl: "https://github.com/acme/storefront/commit/9f8e7d6",
      // Bot-pushed commits carry no linked GitHub user.
      author: { name: "dependabot[bot]", user: null },
      statusCheckRollup: { state: "FAILURE" },
    },
  },
  pullRequests: { totalCount: 0 },
  vulnerabilityAlerts: null,
};

export const PULL_REQUEST_NODE: PullRequestNode = {
  number: 482,
  title: "Extract pricing client",
  state: "OPEN",
  isDraft: false,
  headRefName: "extract-pricing",
  baseRefName: "main",
  createdAt: "2026-07-20T09:14:00Z",
  updatedAt: "2026-07-21T14:30:00Z",
  mergedAt: null,
  mergeable: "MERGEABLE",
  reviewDecision: "APPROVED",
  url: "https://github.com/acme/checkout-svc/pull/482",
  author: {
    login: "alice",
    avatarUrl: "https://avatars.githubusercontent.com/u/1",
    url: "https://github.com/alice",
  },
  mergeCommit: null,
  commits: { nodes: [{ commit: { statusCheckRollup: { state: "SUCCESS" } } }] },
};

/** A merged PR with no checks reported and no review — the sparse end. */
export const PULL_REQUEST_NODE_MERGED: PullRequestNode = {
  number: 470,
  title: "Retry idempotency keys",
  state: "MERGED",
  isDraft: false,
  headRefName: "retry-keys",
  baseRefName: "main",
  createdAt: "2026-07-11T10:00:00Z",
  updatedAt: "2026-07-12T16:20:00Z",
  mergedAt: "2026-07-12T16:20:00Z",
  mergeable: "UNKNOWN",
  reviewDecision: null,
  url: "https://github.com/acme/checkout-svc/pull/470",
  author: null,
  mergeCommit: {
    oid: "c0ffee1234567890abcdef1234567890abcdef12",
    abbreviatedOid: "c0ffee1",
    messageHeadline: "Retry idempotency keys (#470)",
    committedDate: "2026-07-12T16:20:00Z",
    commitUrl: "https://github.com/acme/checkout-svc/commit/c0ffee1",
  },
  commits: { nodes: [{ commit: { statusCheckRollup: null } }] },
};

export const WORKFLOW_RUN: RestWorkflowRun = {
  id: 9182734,
  name: "CI",
  run_number: 1842,
  head_branch: "main",
  head_sha: "a1b2c3d4e5f60718293a4b5c6d7e8f9012345678",
  status: "completed",
  conclusion: "success",
  created_at: "2026-07-24T18:02:20Z",
  run_started_at: "2026-07-24T18:02:30Z",
  updated_at: "2026-07-24T18:06:12Z",
  html_url: "https://github.com/acme/checkout-svc/actions/runs/9182734",
  triggering_actor: {
    login: "alice",
    avatar_url: "https://avatars.githubusercontent.com/u/1",
    html_url: "https://github.com/alice",
  },
  pull_requests: [{ number: 482 }],
  head_commit: {
    id: "a1b2c3d4e5f60718293a4b5c6d7e8f9012345678",
    message: "Extract pricing client\n\nSplit the pricing HTTP client out.",
    timestamp: "2026-07-24T18:02:11Z",
  },
};

/** Still running: no conclusion, so no completion time and no duration. */
export const WORKFLOW_RUN_IN_PROGRESS: RestWorkflowRun = {
  id: 9182999,
  name: "CI",
  run_number: 1843,
  head_branch: "extract-pricing",
  head_sha: "b2c3d4e5f60718293a4b5c6d7e8f901234567890",
  status: "in_progress",
  conclusion: null,
  created_at: "2026-07-25T09:00:00Z",
  updated_at: "2026-07-25T09:00:30Z",
  html_url: "https://github.com/acme/checkout-svc/actions/runs/9182999",
  actor: { login: "bob" },
  pull_requests: [],
  head_commit: null,
};

export const WORKFLOW_RUN_FAILED: RestWorkflowRun = {
  ...WORKFLOW_RUN,
  id: 9182111,
  run_number: 1841,
  conclusion: "failure",
  html_url: "https://github.com/acme/checkout-svc/actions/runs/9182111",
};

export const DEPENDABOT_ALERT: RestDependabotAlert = {
  number: 42,
  state: "open",
  created_at: "2026-06-30T11:04:00Z",
  html_url: "https://github.com/acme/checkout-svc/security/dependabot/42",
  dependency: {
    package: { name: "tar-fs" },
    manifest_path: "package-lock.json",
  },
  security_advisory: {
    summary: "tar-fs path traversal",
    severity: "high",
  },
};

export const CODE_SCANNING_ALERT: RestCodeScanningAlert = {
  number: 1234,
  state: "open",
  created_at: "2026-07-02T08:15:00Z",
  html_url: "https://github.com/acme/checkout-svc/security/code-scanning/1234",
  rule: {
    id: "js/sql-injection",
    description: "Database query built from user-controlled sources",
    severity: "error",
    security_severity_level: "critical",
  },
  most_recent_instance: { location: { path: "src/db/orders.ts" } },
};

/** A non-security CodeQL rule: no `security_severity_level`, lint scale only. */
export const CODE_SCANNING_ALERT_QUALITY: RestCodeScanningAlert = {
  number: 1235,
  state: "dismissed",
  created_at: "2026-07-03T08:15:00Z",
  html_url: "https://github.com/acme/checkout-svc/security/code-scanning/1235",
  rule: {
    id: "js/unused-local-variable",
    description: "Unused variable",
    severity: "note",
    security_severity_level: null,
  },
  most_recent_instance: { location: { path: "src/util/format.ts" } },
};

export const SECRET_SCANNING_ALERT: RestSecretScanningAlert = {
  number: 7,
  state: "open",
  created_at: "2026-07-19T22:41:00Z",
  html_url: "https://github.com/acme/checkout-svc/security/secret-scanning/7",
  secret_type: "stripe_api_key",
  secret_type_display_name: "Stripe API Key",
};

export const RELEASE: RestRelease = {
  tag_name: "v3.7.12",
  name: "3.7.12",
  prerelease: false,
  published_at: "2026-07-18T12:00:00Z",
  body: "### Fixed\n- Retry idempotency keys",
  html_url: "https://github.com/acme/checkout-svc/releases/tag/v3.7.12",
  author: {
    login: "alice",
    avatar_url: "https://avatars.githubusercontent.com/u/1",
    html_url: "https://github.com/alice",
  },
};

export const ISSUE: RestIssue = {
  number: 91,
  title: "Checkout latency spikes at 14:00",
  state: "open",
  created_at: "2026-07-22T14:12:00Z",
  updated_at: "2026-07-23T09:30:00Z",
  closed_at: null,
  html_url: "https://github.com/acme/checkout-svc/issues/91",
  user: { login: "bob" },
  assignees: [{ login: "alice" }],
  labels: [{ name: "bug" }, { name: "p1" }],
};

/** `GET /issues` returns pull requests too; `listIssues` has to drop these. */
export const ISSUE_THAT_IS_A_PR: RestIssue = {
  number: 482,
  title: "Extract pricing client",
  state: "open",
  created_at: "2026-07-20T09:14:00Z",
  updated_at: "2026-07-21T14:30:00Z",
  closed_at: null,
  html_url: "https://github.com/acme/checkout-svc/pull/482",
  user: { login: "alice" },
  assignees: [],
  labels: [],
  pull_request: {
    url: "https://api.github.com/repos/acme/checkout-svc/pulls/482",
  },
};
