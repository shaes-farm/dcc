import {
  formatUri,
  type Actor,
  type Issue,
  type PullRequest,
  type Release,
  type Repository,
  type SecurityAlert,
  type Uri,
  type WorkflowRun,
} from "@/lib/domain";

import type { PullRequestNode, RepoNode } from "./queries";
import {
  ADVISORY_SEVERITY,
  CHECK_ROLLUP,
  PR_STATE,
  RULE_SEVERITY,
  SECRET_SCANNING_SEVERITY,
  alertState,
  mergeable,
  reviewState,
  runStatus,
  toStatus,
} from "./status";

/**
 * The only file allowed to name a GitHub field.
 *
 * `lib/providers/README.md`'s first rule: normalize upstream payloads into
 * `lib/domain` types before they leave this layer. Everything above this file
 * — route handlers, queries, panels — sees `Repository` and `PullRequest`, not
 * `html_url` and `head_ref_name`, which is what lets a GitLab provider slot in
 * later without touching a panel.
 *
 * Two rules hold throughout: every URI is minted through `formatUri` so the
 * codec owns the grammar (never string concatenation), and every timestamp
 * stays the ISO string GitHub sent, since these objects cross the route-handler
 * JSON boundary.
 */

/** The repo coordinates every normalizer needs to mint URIs. */
export interface RepoCoords {
  /** Config `Provider` id — the first segment of every URI minted here. */
  provider: string;
  owner: string;
  name: string;
  /** Config-declared repo id, unique in the workspace. */
  id: string;
  tags: string[];
}

export function repoUri(coords: RepoCoords): Uri {
  return formatUri({
    scheme: "repo",
    provider: coords.provider,
    owner: coords.owner,
    name: coords.name,
  });
}

// --- GraphQL -------------------------------------------------------------

export function toRepository(node: RepoNode, coords: RepoCoords): Repository {
  const target = node.defaultBranchRef?.target ?? null;

  return {
    uri: repoUri(coords),
    id: coords.id,
    owner: node.owner.login,
    name: node.name,
    provider: coords.provider,
    // A repository with no commits has no default branch ref; the config-facing
    // name is still "main" as far as anything downstream is concerned.
    defaultBranch: node.defaultBranchRef?.name ?? "main",
    tags: coords.tags,
    description: node.description ?? undefined,
    archived: node.isArchived,
    url: node.url,
    status: toStatus(CHECK_ROLLUP, target?.statusCheckRollup?.state),
    lastCommit: target?.oid
      ? {
          sha: target.oid,
          shortSha: target.abbreviatedOid,
          message: target.messageHeadline,
          author: target.author?.user
            ? {
                login: target.author.user.login,
                name: target.author.name ?? undefined,
                avatarUrl: target.author.user.avatarUrl,
                url: target.author.user.url,
              }
            : undefined,
          committedAt: target.committedDate,
          url: target.commitUrl,
        }
      : undefined,
    openPullRequestCount: node.pullRequests.totalCount,
    // Absent rather than 0 when the credential lacks `security_events`: "we did
    // not look" and "we looked and found none" are different answers, and a
    // badge showing 0 for the first is the guess §2.2 forbids.
    openAlertCount: node.vulnerabilityAlerts?.totalCount,
  };
}

export function toPullRequest(
  node: PullRequestNode,
  coords: RepoCoords,
): PullRequest {
  const rollup = node.commits.nodes[0]?.commit.statusCheckRollup?.state;

  return {
    uri: formatUri({
      scheme: "pr",
      provider: coords.provider,
      owner: coords.owner,
      repo: coords.name,
      number: node.number,
    }),
    repo: repoUri(coords),
    number: node.number,
    title: node.title,
    author: node.author
      ? {
          login: node.author.login,
          avatarUrl: node.author.avatarUrl,
          url: node.author.url,
        }
      : undefined,
    state: PR_STATE[node.state] ?? "open",
    draft: node.isDraft,
    sourceBranch: node.headRefName,
    targetBranch: node.baseRefName,
    checks: toStatus(CHECK_ROLLUP, rollup),
    review: reviewState(node.reviewDecision),
    mergeable: mergeable(node.mergeable),
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
    mergedAt: node.mergedAt ?? undefined,
    mergeCommit: node.mergeCommit
      ? {
          sha: node.mergeCommit.oid,
          shortSha: node.mergeCommit.abbreviatedOid,
          message: node.mergeCommit.messageHeadline,
          committedAt: node.mergeCommit.committedDate,
          url: node.mergeCommit.commitUrl,
        }
      : undefined,
    url: node.url,
  };
}

// --- REST payloads -------------------------------------------------------

/** The fields of a GitHub user we read; the payload carries dozens more. */
export interface RestActor {
  login: string;
  avatar_url?: string;
  html_url?: string;
  name?: string | null;
}

export interface RestWorkflowRun {
  id: number;
  name: string | null;
  run_number?: number;
  head_branch: string | null;
  head_sha: string;
  status: string | null;
  conclusion: string | null;
  created_at: string;
  run_started_at?: string;
  updated_at: string;
  html_url: string;
  actor?: RestActor | null;
  triggering_actor?: RestActor | null;
  pull_requests?: { number: number }[] | null;
  head_commit?: {
    id: string;
    message: string;
    timestamp: string;
  } | null;
}

export interface RestDependabotAlert {
  number: number;
  state: string;
  created_at: string;
  html_url: string;
  dependency?: {
    package?: { name?: string } | null;
    manifest_path?: string;
  } | null;
  security_advisory?: { summary?: string; severity?: string } | null;
  security_vulnerability?: { severity?: string } | null;
}

export interface RestCodeScanningAlert {
  number: number;
  state: string;
  created_at: string;
  html_url: string;
  rule?: {
    id?: string;
    description?: string;
    severity?: string;
    security_severity_level?: string | null;
  } | null;
  most_recent_instance?: { location?: { path?: string } | null } | null;
}

export interface RestSecretScanningAlert {
  number: number;
  state: string;
  created_at: string;
  html_url: string;
  secret_type?: string;
  secret_type_display_name?: string;
}

export interface RestRelease {
  tag_name: string;
  name: string | null;
  prerelease: boolean;
  published_at: string | null;
  body?: string | null;
  html_url: string;
  author?: RestActor | null;
}

export interface RestIssue {
  number: number;
  title: string;
  state: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  html_url: string;
  user?: RestActor | null;
  assignees?: { login: string }[] | null;
  labels?: ({ name?: string } | string)[] | null;
  /**
   * Present when the "issue" is actually a pull request — `GET /issues` returns
   * both, and §3.1 keeps them separate objects. `listIssues` filters on this.
   */
  pull_request?: unknown;
}

export function toWorkflowRun(
  run: RestWorkflowRun,
  coords: RepoCoords,
): WorkflowRun {
  const startedAt = run.run_started_at ?? run.created_at;
  const completedAt = run.conclusion ? run.updated_at : undefined;
  const firstPr = run.pull_requests?.[0];

  return {
    uri: formatUri({
      scheme: "run",
      provider: coords.provider,
      owner: coords.owner,
      repo: coords.name,
      runId: String(run.id),
    }),
    repo: repoUri(coords),
    id: String(run.id),
    name: run.name ?? "workflow",
    runNumber: run.run_number,
    commit: {
      sha: run.head_sha,
      shortSha: run.head_sha.slice(0, 7),
      message: run.head_commit?.message.split("\n")[0],
      committedAt: run.head_commit?.timestamp,
    },
    branch: run.head_branch ?? undefined,
    status: runStatus(run.status, run.conclusion),
    conclusion: run.conclusion ?? undefined,
    startedAt,
    completedAt,
    durationMs: completedAt
      ? Math.max(0, Date.parse(completedAt) - Date.parse(startedAt))
      : undefined,
    actor: toActor(run.triggering_actor ?? run.actor),
    pullRequest: firstPr
      ? formatUri({
          scheme: "pr",
          provider: coords.provider,
          owner: coords.owner,
          repo: coords.name,
          number: firstPr.number,
        })
      : undefined,
    // Empty until artifact lineage lands (§2.2: "Artifact nodes are *derived*"
    // from a workload's image reference matched back to the run). The field is
    // required, so this is a real "none known yet", not a stub.
    producedArtifacts: [],
    url: run.html_url,
  };
}

export function toDependabotAlert(
  alert: RestDependabotAlert,
  coords: RepoCoords,
): SecurityAlert {
  const packageName = alert.dependency?.package?.name;

  return {
    uri: alertUri(coords, "dependabot", alert.number),
    source: "dependabot",
    severity:
      ADVISORY_SEVERITY[
        alert.security_advisory?.severity ??
          alert.security_vulnerability?.severity ??
          ""
      ] ?? "info",
    title:
      alert.security_advisory?.summary ??
      (packageName
        ? `Vulnerability in ${packageName}`
        : "Dependabot vulnerability"),
    repo: repoUri(coords),
    path: alert.dependency?.manifest_path,
    firstSeen: alert.created_at,
    state: alertState(alert.state),
    url: alert.html_url,
  };
}

export function toCodeScanningAlert(
  alert: RestCodeScanningAlert,
  coords: RepoCoords,
): SecurityAlert {
  const rule = alert.rule ?? {};

  return {
    uri: alertUri(coords, "code-scanning", alert.number),
    source: "code-scanning",
    // `security_severity_level` is the security scale and wins when present;
    // `rule.severity` is the lint scale every other rule reports on.
    severity:
      ADVISORY_SEVERITY[rule.security_severity_level ?? ""] ??
      RULE_SEVERITY[rule.severity ?? ""] ??
      "info",
    title: rule.description ?? rule.id ?? "Code scanning alert",
    repo: repoUri(coords),
    path: alert.most_recent_instance?.location?.path,
    firstSeen: alert.created_at,
    state: alertState(alert.state),
    url: alert.html_url,
  };
}

export function toSecretScanningAlert(
  alert: RestSecretScanningAlert,
  coords: RepoCoords,
): SecurityAlert {
  const kind = alert.secret_type_display_name ?? alert.secret_type ?? "secret";

  return {
    uri: alertUri(coords, "secret-scanning", alert.number),
    source: "secret-scanning",
    severity: SECRET_SCANNING_SEVERITY,
    title: `${kind} committed to the repository`,
    repo: repoUri(coords),
    firstSeen: alert.created_at,
    state: alertState(alert.state),
    url: alert.html_url,
  };
}

export function toRelease(release: RestRelease, coords: RepoCoords): Release {
  return {
    // `Release` carries no `uri` — §3.2 defines no scheme for it, so it is
    // referenced by its repo plus its tag (lib/domain/git.ts).
    repo: repoUri(coords),
    tag: release.tag_name,
    name: release.name ?? undefined,
    prerelease: release.prerelease,
    publishedAt: release.published_at ?? undefined,
    author: toActor(release.author),
    body: release.body ?? undefined,
    url: release.html_url,
  };
}

export function toIssue(issue: RestIssue, coords: RepoCoords): Issue {
  return {
    repo: repoUri(coords),
    number: issue.number,
    title: issue.title,
    state: issue.state === "closed" ? "closed" : "open",
    author: toActor(issue.user),
    assignees: (issue.assignees ?? []).map((assignee) => assignee.login),
    labels: (issue.labels ?? [])
      .map((label) => (typeof label === "string" ? label : label.name))
      .filter((label): label is string => Boolean(label)),
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
    closedAt: issue.closed_at ?? undefined,
    url: issue.html_url,
  };
}

// --- shared --------------------------------------------------------------

/**
 * Repo-qualified per ADR-0006: GitHub numbers alerts per repository, so a bare
 * number collides across the workspace that §6.1's rollup merges. `formatUri`
 * percent-escapes the slashes, keeping it one segment.
 */
function alertUri(
  coords: RepoCoords,
  source: SecurityAlert["source"],
  number: number,
): Uri {
  return formatUri({
    scheme: "alert",
    provider: coords.provider,
    source,
    id: `${coords.owner}/${coords.name}/${number}`,
  });
}

function toActor(actor: RestActor | null | undefined): Actor | undefined {
  if (!actor) return undefined;
  return {
    login: actor.login,
    name: actor.name ?? undefined,
    avatarUrl: actor.avatar_url,
    url: actor.html_url,
  };
}
