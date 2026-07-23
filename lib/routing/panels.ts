/**
 * The panel library (spec §5.3) — every panel a URI can resolve to.
 *
 * Panels are the unit of UI in DCC: a self-contained, URI-parameterized
 * component (§5.3), arranged into layouts by the slot engine
 * (https://github.com/shaes-farm/dcc/issues/12). This file names them and
 * nothing more. It holds no components and imports no React on purpose — the
 * resolver has to be testable in a node environment, and a panel id has to be
 * storable in a layout preset, neither of which should drag a component tree
 * along.
 */

/**
 * Every panel in the v1 library, in §5.3's order.
 *
 * A `const` array plus a derived type, like `STATUSES` and `URI_SCHEMES`, so
 * the UI can iterate the set and a test can assert it.
 */
export const PANEL_IDS = [
  "workspace-health",
  "service-cockpit",
  "repos",
  "prs",
  "workflow-runs",
  "security",
  "environments",
  "pods",
  "pod-detail",
  "deploys",
  "logs",
  "log-search",
  "rest-explorer",
  "graphql-explorer",
  "health-board",
  "error-rates",
  "latency",
  "pinned-dashboard",
  // Not in §5.3's list as written — §3.2 defines `trace://` URIs with no panel
  // to resolve them to, and ADR-0001 closes that gap. Grouped with the rest of
  // the §6.4 observability family rather than appended, since that is where it
  // belongs when the panel itself lands in Phase 4. See docs/adr/adr-0001.md.
  "trace-viewer",
  "context",
  "documents",
  "document-viewer",
  "lineage-strip",
  "artifacts",
  "audit-log",
] as const;

export type PanelId = (typeof PANEL_IDS)[number];
