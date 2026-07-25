"use client";

import { Panel } from "@/components/ds/panel";
import { StatusBadge } from "@/components/ds/status-badge";

import type { PanelComponentProps } from "../registry";
import { fixtureSuccess, useFixtureData } from "../use-fixture-data";

interface PrFixture {
  title: string;
  author: string;
  checksStatus: "healthy" | "degraded" | "failing";
  asOf: string;
}

const loadFixture = fixtureSuccess<PrFixture>({
  title: "Add checkout retries",
  author: "alice",
  checksStatus: "healthy",
  asOf: "2m ago",
});

/** Fixture stand-in for the `prs` panel — real data lands with #11's `GitProvider`. */
export function PrsPanel({ params, actions }: PanelComponentProps) {
  const state = useFixtureData(loadFixture);
  if (params.scheme !== "pr") return null;

  return (
    <Panel
      title={`PR · ${params.owner}/${params.repo}#${params.number}`}
      asOf={state.status === "success" ? state.data.asOf : undefined}
      actions={actions}
    >
      {state.status === "success" ? (
        <div className="flex flex-col gap-2 text-sm">
          <span className="text-body">{state.data.title}</span>
          <span className="text-faint font-mono text-xs">
            opened by {state.data.author}
          </span>
          <StatusBadge status={state.data.checksStatus}>checks</StatusBadge>
        </div>
      ) : (
        <p className="text-faint text-sm">Loading…</p>
      )}
    </Panel>
  );
}
