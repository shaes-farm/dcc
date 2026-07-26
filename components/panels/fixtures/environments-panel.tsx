"use client";

import { Panel } from "@/components/ds/panel";
import { StatusBadge } from "@/components/ds/status-badge";
import type { Status } from "@/lib/domain";

import type { PanelComponentProps } from "../registry";
import { fixtureSuccess, useFixtureData } from "../use-fixture-data";

interface EnvironmentsFixture {
  services: Array<{ name: string; status: Status }>;
  asOf: string;
}

const loadFixture = fixtureSuccess<EnvironmentsFixture>({
  services: [
    { name: "checkout", status: "healthy" },
    { name: "payments", status: "degraded" },
    { name: "catalog", status: "healthy" },
  ],
  asOf: "15s ago",
});

/** Fixture stand-in for the `environments` panel — real data lands with #10's `DeploymentProvider`. */
export function EnvironmentsPanel({ params, actions }: PanelComponentProps) {
  const state = useFixtureData(loadFixture);
  if (params.scheme !== "env") return null;

  return (
    <Panel
      title={`Environment · ${params.env}`}
      asOf={state.status === "success" ? state.data.asOf : undefined}
      actions={actions}
      pad={false}
    >
      {state.status === "success" ? (
        <ul className="divide-hairline divide-y">
          {state.data.services.map((service) => (
            <li
              key={service.name}
              className="flex items-center justify-between px-2.5 py-1.5"
            >
              <span className="font-mono text-sm">{service.name}</span>
              <StatusBadge status={service.status} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-faint p-2.5 text-sm">Loading…</p>
      )}
    </Panel>
  );
}
