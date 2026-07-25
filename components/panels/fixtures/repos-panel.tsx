"use client";

import { Panel } from "@/components/ds/panel";
import { Addressable } from "@/components/uri/addressable";
import { UriChip } from "@/components/uri/uri-chip";

import type { PanelComponentProps } from "../registry";
import { fixtureSuccess, useFixtureData } from "../use-fixture-data";

interface RepoFixture {
  defaultBranch: string;
  openPullRequests: number;
  lastCommit: string;
}

const loadFixture = fixtureSuccess<RepoFixture>({
  defaultBranch: "main",
  openPullRequests: 3,
  lastCommit: "8s ago",
});

/** Fixture stand-in for the `repos` panel — real data lands with #11's `GitProvider`. */
export function ReposPanel({ uri, params, actions }: PanelComponentProps) {
  const state = useFixtureData(loadFixture);
  if (params.scheme !== "repo") return null;

  return (
    <Panel
      title={`Repository · ${params.owner}/${params.name}`}
      asOf={state.status === "success" ? state.data.lastCommit : undefined}
      actions={actions}
    >
      {state.status === "success" ? (
        <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-faint font-mono text-xs">default branch</dt>
          <dd className="font-mono text-xs">{state.data.defaultBranch}</dd>
          <dt className="text-faint font-mono text-xs">open PRs</dt>
          <dd className="font-mono text-xs">{state.data.openPullRequests}</dd>
          <dt className="text-faint font-mono text-xs">uri</dt>
          <dd>
            <Addressable uri={uri}>
              <UriChip uri={uri} />
            </Addressable>
          </dd>
        </dl>
      ) : (
        <p className="text-faint text-sm">Loading…</p>
      )}
    </Panel>
  );
}
