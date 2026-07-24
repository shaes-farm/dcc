import type { IsoDateTime, Provider, Status, Uri } from "@/lib/domain";

/**
 * The behavioral provider contract (spec §2.2, ADR-0002) — the plugin
 * interface every integration category extends.
 *
 * Naming: §3.1 gives the data-only "configured integration instance" the name
 * `Provider`, which lives in `lib/domain`; §2.2 gives the *behavioral* plugin
 * the same name. They are different things, so this layer calls the behavioral
 * one `ProviderAdapter` and has it extend the domain `Provider` — the adapter
 * *is* a configured instance that can also act. See `lib/domain/README.md`
 * ("`Provider` vs `ProviderAdapter`"), which pre-decided this split.
 *
 * Two rules hold across every adapter (`lib/providers/README.md`): methods
 * return normalized `lib/domain` types, never upstream payloads; and an adapter
 * self-describes via `capabilities()`, so the UI renders only what it declares
 * — no capability, no affordance.
 */
export interface ProviderAdapter extends Provider {
  /**
   * The optional operations this instance actually supports. The UI gates
   * every affordance on membership here (via `hasCapability`), so an adapter
   * that omits an optional method must also omit its capability id.
   */
  capabilities(): Capability[];
  /** Probes reachability; powers the Settings "test" buttons (§2.2, §8). */
  testConnection(): Promise<ConnectionResult>;
}

/**
 * Every affordance-gated operation across all provider kinds (§2.2). Each id
 * names exactly one **optional** (`?:`) method on some provider interface; the
 * mandatory methods need no capability because every implementation has them.
 *
 * Closed union as a `const` array plus a derived type (repo convention), so the
 * UI can iterate the set and tests can assert it.
 */
export const CAPABILITIES = [
  // GitProvider
  "list-issues", // listIssues?
  "rerun-workflow", // rerunWorkflow?
  // DeploymentProvider
  "restart-workload", // restartWorkload?
  "trigger-deploy", // triggerDeploy?
  // ObservabilityProvider (every method is optional)
  "query-metrics", // queryMetrics?
  "search-logs", // searchLogs?
  "get-trace", // getTrace?
  "list-dashboards", // listDashboards?
] as const;

export type Capability = (typeof CAPABILITIES)[number];

/**
 * The outcome of `testConnection()` (§2.2). Normalized like everything else
 * that crosses into the UI: `status` is the shared vocabulary, `checkedAt` an
 * ISO string rather than a `Date`.
 */
export interface ConnectionResult {
  /** Whether the probe reached the provider and authenticated. */
  ok: boolean;
  /** Reachability as the shared status vocabulary (§2.2); `unknown` when the probe never completed. */
  status: Status;
  checkedAt: IsoDateTime;
  latencyMs?: number;
  /** Human-readable detail for the Settings row — an error class, a hint. */
  message?: string;
}

/**
 * The outcome of a safe action (§7.1) — `rerunWorkflow`, `restartWorkload`,
 * `triggerDeploy`. The declaration and audit log belong to the action
 * framework behind `/api/actions/*`; this is only what the adapter reports back
 * so the confirmation UX can close.
 */
export interface ActionResult {
  ok: boolean;
  at: IsoDateTime;
  /**
   * What was acted on — a `run`, `workload`, or `env` URI. Required: the
   * adapter is always handed a concrete target, and the audit entry echoes it
   * back, so an absent one has no meaning.
   */
  targetUri: Uri;
  /** Provider detail: a queued-run URL, a rejection reason. */
  message?: string;
}

/**
 * The recurring scope argument on list operations: a specific object's `Uri`,
 * or the literal `"workspace"` for "everything, across every configured
 * instance" (§2.2, e.g. `listAlerts(scope: Uri | "workspace")`).
 */
export type Scope = Uri | "workspace";
