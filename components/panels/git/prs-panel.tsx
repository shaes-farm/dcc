"use client";

import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import { EmptyState } from "@/components/ds/empty-state";
import { Panel } from "@/components/ds/panel";
import { StatusBadge } from "@/components/ds/status-badge";
import { Addressable } from "@/components/uri/addressable";
import { UriChip } from "@/components/uri/uri-chip";
import {
  formatUri,
  type ParsedUriOf,
  type ReviewState,
  type Status,
  type Uri,
} from "@/lib/domain";
import { pullRequestsQuery } from "@/lib/queries/git";

import { useDataAge } from "../data-age";
import type { PanelComponentProps } from "../registry";
import { GitPanelError } from "./panel-error";

/**
 * The `prs` panel (§6.1 panel 2) bound to one pull request: check status,
 * review state, mergeability and age.
 *
 * The scheme guard is its own component so the body below can hold hooks with
 * a `pr://` URI already in hand — a conditional return above a `useQuery` would
 * change hook order between renders.
 */
export function PrsPanel({ uri, params, actions }: PanelComponentProps) {
  if (params.scheme !== "pr") return null;
  return <PullRequestBody uri={uri} params={params} actions={actions} />;
}

/**
 * A `pr://` URI already carries owner and repo, so this derives the `repo://`
 * URI and reads that repo's PR list rather than a per-PR endpoint. That keeps
 * `GitProvider` at the five methods §2.2 defines, and the list is one GraphQL
 * round trip that every other PR view on the same repo shares through TanStack
 * Query's cache.
 */
function PullRequestBody({
  uri,
  params,
  actions,
}: {
  uri: Uri;
  params: ParsedUriOf<"pr">;
  actions?: ReactNode;
}) {
  const repo = formatUri({
    scheme: "repo",
    provider: params.provider,
    owner: params.owner,
    name: params.repo,
  });

  const query = useQuery(pullRequestsQuery(repo));
  const asOf = useDataAge(query.dataUpdatedAt);

  const pr = query.data?.find(
    (candidate) => candidate.number === params.number,
  );

  return (
    <Panel
      title={`PR · ${params.owner}/${params.repo}#${params.number}`}
      asOf={query.data ? asOf : undefined}
      actions={actions}
    >
      {query.error ? (
        <GitPanelError error={query.error} />
      ) : pr ? (
        <div className="flex flex-col gap-2.5 text-sm">
          <span className="text-body">{pr.title}</span>

          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status={pr.checks}>checks</StatusBadge>
            <StatusBadge status={reviewStatus(pr.review)}>
              {pr.review}
            </StatusBadge>
            {pr.mergeable === false ? (
              <StatusBadge status="failing">conflicts</StatusBadge>
            ) : null}
            {pr.draft ? (
              <StatusBadge status="unknown">draft</StatusBadge>
            ) : null}
          </div>

          <dl className="grid grid-cols-[6rem_1fr] gap-x-4 gap-y-1.5">
            <dt className="text-faint font-mono text-xs">state</dt>
            <dd className="font-mono text-xs">{pr.state}</dd>

            <dt className="text-faint font-mono text-xs">branch</dt>
            <dd className="truncate font-mono text-xs">
              {pr.sourceBranch} → {pr.targetBranch}
            </dd>

            {pr.author ? (
              <>
                <dt className="text-faint font-mono text-xs">author</dt>
                <dd className="font-mono text-xs">{pr.author.login}</dd>
              </>
            ) : null}

            <dt className="text-faint font-mono text-xs">uri</dt>
            <dd>
              <Addressable uri={uri}>
                <UriChip uri={uri} />
              </Addressable>
            </dd>
          </dl>
        </div>
      ) : query.isPending ? (
        <p className="text-faint text-sm">Loading…</p>
      ) : (
        <EmptyState
          message={`#${params.number} is not among this repository's pull requests`}
        />
      )}
    </Panel>
  );
}

/**
 * Review state onto the shared status vocabulary, for the badge only. The
 * domain keeps the two as separate types on purpose — a review is not a health
 * — and this mapping exists so one glyph ladder covers the whole panel (§8).
 */
function reviewStatus(review: ReviewState): Status {
  if (review === "approved") return "healthy";
  if (review === "changes-requested") return "failing";
  if (review === "review-required") return "degraded";
  return "unknown";
}
