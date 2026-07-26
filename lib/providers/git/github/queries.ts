/**
 * The GraphQL v4 side of the adapter (§6.1 "REST + GraphQL v4", ADR-0005).
 *
 * GraphQL is used where REST would be N+1. The repo rollup needs a check state,
 * an open-PR count and an alert count per repository — three REST calls each,
 * times every configured repo, every 60s — and returns all of it here in one
 * request. The PR list needs a check rollup, a review decision and mergeability
 * per PR, which REST charges another three calls each for.
 *
 * Everything GraphQL does not serve (Actions runs, the three alert endpoints,
 * releases) stays on REST in `github-git-provider.ts`.
 */

/** One repository's rollup, as `repoQuery` aliases it. */
export interface RepoNode {
  name: string;
  owner: { login: string };
  description: string | null;
  isArchived: boolean;
  url: string;
  defaultBranchRef: {
    name: string;
    target: {
      oid?: string;
      abbreviatedOid?: string;
      messageHeadline?: string;
      committedDate?: string;
      commitUrl?: string;
      author?: {
        user: { login: string; avatarUrl: string; url: string } | null;
        name: string | null;
      } | null;
      statusCheckRollup?: { state: string } | null;
    } | null;
  } | null;
  pullRequests: { totalCount: number };
  /**
   * Needs `security_events` (or repo admin); a credential without it makes the
   * whole alias `null` plus a `FORBIDDEN` error, which the caller drops rather
   * than failing the panel.
   */
  vulnerabilityAlerts?: { totalCount: number } | null;
}

/** One PR, as `pullRequestsQuery` returns it. */
export interface PullRequestNode {
  number: number;
  title: string;
  state: string;
  isDraft: boolean;
  headRefName: string;
  baseRefName: string;
  createdAt: string;
  updatedAt: string;
  mergedAt: string | null;
  mergeable: string | null;
  reviewDecision: string | null;
  url: string;
  author: { login: string; avatarUrl: string; url: string } | null;
  mergeCommit: {
    oid: string;
    abbreviatedOid: string;
    messageHeadline: string;
    committedDate: string;
    commitUrl: string;
  } | null;
  commits: {
    nodes: { commit: { statusCheckRollup: { state: string } | null } }[];
  };
}

/**
 * The commit fields every query selects. `statusCheckRollup` is the aggregate
 * §6.1 wants ("default-branch CI status"), not the per-check detail.
 */
const COMMIT_FIELDS = `
  oid
  abbreviatedOid
  messageHeadline
  committedDate
  commitUrl
  author { name user { login avatarUrl url } }
`;

const REPO_FIELDS = `
  name
  owner { login }
  description
  isArchived
  url
  defaultBranchRef {
    name
    target {
      ... on Commit {
        ${COMMIT_FIELDS}
        statusCheckRollup { state }
      }
    }
  }
  pullRequests(states: OPEN) { totalCount }
  vulnerabilityAlerts(states: OPEN) { totalCount }
`;

/**
 * One query covering every configured repository, aliased `r0`, `r1`, … —
 * GraphQL has no "give me these N repositories" argument, and aliasing is how
 * you batch anyway. A repo the credential cannot see comes back as a `null`
 * alias plus an error entry, so one bad line in the config costs one card
 * rather than the panel.
 */
export function repoQuery(count: number): string {
  const aliases = Array.from(
    { length: count },
    (_unused, index) =>
      `r${index}: repository(owner: $owner${index}, name: $name${index}) { ${REPO_FIELDS} }`,
  ).join("\n");

  const params = Array.from(
    { length: count },
    (_unused, index) => `$owner${index}: String!, $name${index}: String!`,
  ).join(", ");

  return `query repos(${params}) {\n${aliases}\n}`;
}

/** Positional variables for `repoQuery`, in the same order as the aliases. */
export function repoVariables(
  repos: { owner: string; name: string }[],
): Record<string, string> {
  const variables: Record<string, string> = {};
  repos.forEach((repo, index) => {
    variables[`owner${index}`] = repo.owner;
    variables[`name${index}`] = repo.name;
  });
  return variables;
}

/**
 * PRs for one repository, newest-updated first. `states` and `baseRefName` push
 * `PrFilter` into the query; `PrFilter.author` has no argument here and is
 * post-filtered, which costs nothing extra because the author is already
 * selected.
 */
export const PULL_REQUESTS_QUERY = `
  query pullRequests(
    $owner: String!
    $name: String!
    $first: Int!
    $states: [PullRequestState!]
    $baseRefName: String
  ) {
    repository(owner: $owner, name: $name) {
      pullRequests(
        first: $first
        states: $states
        baseRefName: $baseRefName
        orderBy: { field: UPDATED_AT, direction: DESC }
      ) {
        nodes {
          number
          title
          state
          isDraft
          headRefName
          baseRefName
          createdAt
          updatedAt
          mergedAt
          mergeable
          reviewDecision
          url
          author { login avatarUrl url }
          mergeCommit { oid abbreviatedOid messageHeadline committedDate commitUrl }
          commits(last: 1) {
            nodes { commit { statusCheckRollup { state } } }
          }
        }
      }
    }
  }
`;

/** `$states` for `PULL_REQUESTS_QUERY`; `undefined` means "no constraint". */
export function prStateFilter(
  state: "open" | "merged" | "closed" | undefined,
): string[] | undefined {
  if (!state) return undefined;
  return [state.toUpperCase()];
}
