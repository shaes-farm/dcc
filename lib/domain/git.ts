import type { Actor, CommitRef, IsoDateTime, Severity, Status } from "./common";
import type { Uri } from "./uri";

/**
 * The Source and Planning stages (spec §3.0) — normalized Git-domain concepts,
 * each independently queryable across all repositories (§6.1). That is what
 * makes "every failed workflow run across every repository" a query rather
 * than a tour of per-repo tabs.
 *
 * `Issue`, `Release`, and `Dependency` carry no `uri`, and neither do
 * `Provider` or `HealthCheck`: §3.1 lists them as canonical objects, but §3.2
 * enumerates no scheme for any of the five and §5.4 does not index them in the
 * palette. In v1 they are reached through their parent — the repository, the
 * service, or Settings.
 *
 * This is a spec gap, not an oversight here. Addressing them means adding
 * schemes to §3.2 first; minting `issue://` or `hc://` locally would fork the
 * codec's grammar (https://github.com/shaes-farm/dcc/issues/3) from the spec
 * it implements.
 */

/** A source repo: application code, library, or infrastructure. */
export interface Repository {
  uri: Uri;
  /** Config-declared id, unique within the workspace. */
  id: string;
  owner: string;
  name: string;
  /** `Provider` id that serves this repo. */
  provider: string;
  defaultBranch: string;
  /** Config tags used for filtering and grouping: `app`, `library`, `nextjs`. */
  tags: string[];
  description?: string;
  archived?: boolean;
  url: string;
  /** CI status of the default branch, normalized (§2.2). */
  status: Status;
  lastCommit?: CommitRef;
  /** Rollups for the repo grid card (§6.1); absent until fetched. */
  openPullRequestCount?: number;
  openAlertCount?: number;
}

/** How a PR stands with reviewers. */
export const REVIEW_STATES = [
  "approved",
  "changes-requested",
  "review-required",
  "none",
] as const;

export type ReviewState = (typeof REVIEW_STATES)[number];

export interface PullRequest {
  uri: Uri;
  /** `repo` URI this PR belongs to. */
  repo: Uri;
  number: number;
  title: string;
  author?: Actor;
  state: "open" | "merged" | "closed";
  draft: boolean;
  sourceBranch: string;
  targetBranch: string;
  /** Aggregate check status, normalized (§2.2). */
  checks: Status;
  review: ReviewState;
  /** False when the PR has conflicts or a blocked branch rule. */
  mergeable?: boolean;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  mergedAt?: IsoDateTime;
  /** Merge commit SHA — the link from a PR to what actually shipped (§5.2). */
  mergeCommit?: CommitRef;
  url: string;
}

/**
 * A tracked work item. GitHub Issues in v1 via the Git provider; the
 * `IssueProvider` for Jira or Linear is defined but unimplemented (§2.2).
 */
export interface Issue {
  /** `repo` URI, or the tracker project once an `IssueProvider` exists. */
  repo: Uri;
  number: number;
  title: string;
  state: "open" | "closed";
  author?: Actor;
  assignees: string[];
  labels: string[];
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  closedAt?: IsoDateTime;
  url: string;
}

export interface Release {
  repo: Uri;
  /** Git tag, e.g. `v3.7.12`. */
  tag: string;
  name?: string;
  prerelease: boolean;
  publishedAt?: IsoDateTime;
  author?: Actor;
  commit?: CommitRef;
  /** Release notes, markdown. */
  body?: string;
  url: string;
}

/**
 * Where an alert came from. Dependabot, CodeQL/code-scanning, and
 * secret-scanning merge into one table (§6.1 panel 4); external scanners such
 * as Wiz appear as an additional source rather than a separate model.
 */
export const ALERT_SOURCES = [
  "dependabot",
  "code-scanning",
  "secret-scanning",
  "external",
] as const;

export type AlertSource = (typeof ALERT_SOURCES)[number];

/** Normalized across every scanner, per §6.1. */
export interface SecurityAlert {
  uri: Uri;
  source: AlertSource;
  severity: Severity;
  title: string;
  /** `repo` URI the alert was raised against. */
  repo: Uri;
  /** File path, when the finding is code-located. */
  path?: string;
  firstSeen: IsoDateTime;
  state: "open" | "dismissed" | "fixed";
  url: string;
}

/**
 * A package a repository depends on. Powers the reverse-dependency hints on
 * repos tagged `library` — "used by storefront, checkout-svc" (§6.1 panel 5).
 */
export interface Dependency {
  /** Package name as the ecosystem spells it: `@acme/ui-kit`, `Acme.Ui`. */
  name: string;
  ecosystem: string;
  /** Resolved version, or the manifest range when only that is knowable. */
  version?: string;
  versionRange?: string;
  /** `repo` URI declaring the dependency. */
  repo: Uri;
  /** False for transitive dependencies. */
  direct: boolean;
  /** `service` URI this package resolves to, when it is one of ours. */
  service?: Uri;
}
