"use client";

import { useQuery } from "@tanstack/react-query";

import { EmptyState } from "@/components/ds/empty-state";
import { Panel } from "@/components/ds/panel";
import { Tag } from "@/components/ds/tag";
import { Addressable } from "@/components/uri/addressable";
import { UriChip } from "@/components/uri/uri-chip";
import type { Severity } from "@/lib/domain";
import { alertsQuery } from "@/lib/queries/git";
import { cn } from "@/lib/utils";

import { useDataAge } from "../data-age";
import type { PanelComponentProps } from "../registry";
import { GitPanelError } from "./panel-error";

/**
 * The `security` panel (§6.1 panel 4): Dependabot, code-scanning and
 * secret-scanning findings across every configured repository, merged into one
 * severity-sorted table.
 *
 * The scope is always the workspace. An `alert://` URI names one finding, not a
 * scope — §6.1's panel is explicitly the cross-repo rollup — so the URI the
 * panel was opened from anchors a row rather than narrowing the query.
 *
 * The merge and the sort are the provider's (`listAlerts`); this renders.
 */
export function SecurityPanel({ uri, params, actions }: PanelComponentProps) {
  const query = useQuery(alertsQuery("workspace"));
  const asOf = useDataAge(query.dataUpdatedAt);

  if (params.scheme !== "alert") return null;

  const alerts = query.data ?? [];

  return (
    <Panel
      title="Security · workspace"
      asOf={query.data ? asOf : undefined}
      actions={actions}
      pad={alerts.length === 0}
    >
      {query.error ? (
        <GitPanelError error={query.error} />
      ) : alerts.length > 0 ? (
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="text-faint border-hairline border-b font-mono text-2xs">
              <th className="px-2.5 py-1.5 font-normal">severity</th>
              <th className="px-2.5 py-1.5 font-normal">source</th>
              <th className="px-2.5 py-1.5 font-normal">finding</th>
              <th className="px-2.5 py-1.5 font-normal">repository</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert) => (
              <tr
                key={alert.uri}
                className={cn(
                  "border-hairline/60 border-b last:border-0",
                  // The URI this panel was opened from, anchored in the rollup.
                  alert.uri === uri && "bg-inset",
                )}
              >
                <td className="px-2.5 py-1.5 align-top">
                  <SeverityTag severity={alert.severity} />
                </td>
                <td className="text-faint px-2.5 py-1.5 align-top font-mono text-xs">
                  {alert.source}
                </td>
                <td className="px-2.5 py-1.5 align-top">
                  <span className="text-body block">{alert.title}</span>
                  {alert.path ? (
                    <span className="text-faint block font-mono text-2xs">
                      {alert.path}
                    </span>
                  ) : null}
                </td>
                <td className="px-2.5 py-1.5 align-top">
                  <Addressable uri={alert.repo}>
                    <UriChip uri={alert.repo} />
                  </Addressable>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : query.isPending ? (
        <p className="text-faint text-sm">Loading…</p>
      ) : (
        <EmptyState message="No open alerts across the workspace" />
      )}
    </Panel>
  );
}

/**
 * Severity as a `Tag`, not a `StatusBadge`: severity is a taxonomy, and the
 * design system reserves the pill for the five-member status vocabulary.
 * Accent marks the two levels worth waking up for.
 */
function SeverityTag({ severity }: { severity: Severity }) {
  return (
    <Tag accent={severity === "critical" || severity === "high"}>
      {severity}
    </Tag>
  );
}
