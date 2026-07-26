"use client";

import { useQuery } from "@tanstack/react-query";

import { EmptyState } from "@/components/ds/empty-state";
import { Panel } from "@/components/ds/panel";
import { StatusBadge } from "@/components/ds/status-badge";
import { Tag } from "@/components/ds/tag";
import { Addressable } from "@/components/uri/addressable";
import { UriChip } from "@/components/uri/uri-chip";
import { reposQuery } from "@/lib/queries/git";

import { useDataAge } from "../data-age";
import type { PanelComponentProps } from "../registry";
import { GitPanelError } from "./panel-error";

/**
 * The `repos` panel (§6.1 panel 1) bound to one repository.
 *
 * It reads the workspace repo list rather than a per-repo endpoint: the list is
 * one GraphQL round trip for every configured repo (ADR-0005), TanStack Query
 * caches it by URL, and every repo card in the layout shares that one response.
 * The workspace-wide repo *grid* is Phase 1 (§11) and will read the same query.
 */
export function ReposPanel({ uri, params, actions }: PanelComponentProps) {
  const query = useQuery(reposQuery());
  const asOf = useDataAge(query.dataUpdatedAt);

  if (params.scheme !== "repo") return null;

  const repo = query.data?.find((candidate) => candidate.uri === uri);

  return (
    <Panel
      title={`Repository · ${params.owner}/${params.name}`}
      asOf={query.data ? asOf : undefined}
      actions={actions}
    >
      {query.error ? (
        <GitPanelError error={query.error} />
      ) : repo ? (
        <dl className="grid grid-cols-[8rem_1fr] items-center gap-x-4 gap-y-2 text-sm">
          <dt className="text-faint font-mono text-xs">default branch</dt>
          <dd className="font-mono text-xs">{repo.defaultBranch}</dd>

          <dt className="text-faint font-mono text-xs">ci</dt>
          <dd>
            <StatusBadge status={repo.status}>{repo.defaultBranch}</StatusBadge>
          </dd>

          <dt className="text-faint font-mono text-xs">open PRs</dt>
          <dd className="font-mono text-xs">
            {repo.openPullRequestCount ?? "—"}
          </dd>

          <dt className="text-faint font-mono text-xs">open alerts</dt>
          <dd className="font-mono text-xs">
            {/* Absent means "we could not look" — a 0 here would be a guess. */}
            {repo.openAlertCount ?? "—"}
          </dd>

          {repo.lastCommit ? (
            <>
              <dt className="text-faint font-mono text-xs">last commit</dt>
              <dd className="truncate font-mono text-xs">
                {repo.lastCommit.shortSha} {repo.lastCommit.message}
              </dd>
            </>
          ) : null}

          {repo.tags.length > 0 ? (
            <>
              <dt className="text-faint font-mono text-xs">tags</dt>
              <dd className="flex flex-wrap gap-1">
                {repo.tags.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </dd>
            </>
          ) : null}

          <dt className="text-faint font-mono text-xs">uri</dt>
          <dd>
            <Addressable uri={uri}>
              <UriChip uri={uri} />
            </Addressable>
          </dd>
        </dl>
      ) : query.isPending ? (
        <p className="text-faint text-sm">Loading…</p>
      ) : (
        <EmptyState
          message={`${params.owner}/${params.name} is not in dcc.config.json`}
          action={
            <span className="text-faint font-mono text-xs">
              Add it to `repositories` to see it here.
            </span>
          }
        />
      )}
    </Panel>
  );
}
