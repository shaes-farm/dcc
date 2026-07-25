"use client";

import { ErrorCard } from "@/components/ds/error-card";
import { Panel } from "@/components/ds/panel";

import type { PanelComponentProps } from "../registry";
import { fixtureFailure, useFixtureData } from "../use-fixture-data";

const loadFixture = fixtureFailure(
  "401 from GitHub — check GITHUB_TOKEN in your shell",
);

/**
 * Fixture stand-in for the `security` panel, deliberately always failing.
 *
 * §5.3: "panels degrade independently — an unreachable provider turns *its*
 * panels into inline error cards; the layout stands." This is the fixture
 * that proves it before a real provider (#11) exists to prove it for real —
 * its siblings in the grid keep rendering their own fixture data unaffected.
 */
export function SecurityPanel({ params, actions }: PanelComponentProps) {
  const state = useFixtureData(loadFixture);
  if (params.scheme !== "alert") return null;

  return (
    <Panel title={`Security · ${params.source}`} actions={actions}>
      {state.status === "loading" ? (
        <p className="text-faint text-sm">Loading…</p>
      ) : state.status === "error" ? (
        <ErrorCard detail={state.error.message} />
      ) : null}
    </Panel>
  );
}
