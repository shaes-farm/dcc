import type { Dashboard, IsoDateTime, Trace } from "@/lib/domain";
import type { LogPage } from "../logs";
import type { ProviderAdapter } from "../provider";

/**
 * The Observe stage (spec §2.2, §3.0) — Prometheus, Loki, Tempo, Grafana. The
 * only interface whose methods are **all** optional: a Prometheus adapter
 * serves metrics but no dashboards, a Grafana adapter the reverse. Every method
 * therefore maps to a `Capability`, and the health board must render from
 * `HealthCheck`s alone when none of these are configured (§6.4).
 *
 * Query and result shapes live here, not in `lib/domain`: the domain owns the
 * addressable nodes (`Dashboard`, `Trace`, `LogStream`), this owns the payloads
 * (`lib/domain/observability.ts`).
 */
export interface ObservabilityProvider extends ProviderAdapter {
  kind: "observability";

  /** Capability: `query-metrics`. Prometheus, Vercel. */
  queryMetrics?(q: MetricQuery): Promise<Series[]>;
  /** Capability: `search-logs`. Loki. Shares `LogPage` with `DeploymentProvider.getLogs`. */
  searchLogs?(q: LogSearch): Promise<LogPage>;
  /** Capability: `get-trace`. Tempo. `traceId` is the raw id from a log line's `trace_id`. */
  getTrace?(traceId: string): Promise<Trace>;
  /** Capability: `list-dashboards`. Grafana. */
  listDashboards?(): Promise<Dashboard[]>;
}

/** A metrics query, provider-native expression plus a time window. */
export interface MetricQuery {
  /** PromQL or the provider's equivalent. */
  expr: string;
  /** Window start (ISO-8601). */
  from: IsoDateTime;
  /** Window end (ISO-8601); defaults to now when absent. */
  to?: IsoDateTime;
  /** Downsample step, e.g. `30s`. */
  step?: string;
}

/** One returned metric series. */
export interface Series {
  /** Label set identifying the series, e.g. `{ service: "checkout", code: "5xx" }`. */
  labels: Record<string, string>;
  /** `[timestamp, value]` pairs, timestamps ISO-8601. */
  points: Array<[IsoDateTime, number]>;
}

/** A log-aggregator search (Loki), distinct from a workload tail. */
export interface LogSearch {
  /** Provider-native selector, e.g. a LogQL matcher. */
  query: string;
  from: IsoDateTime;
  to?: IsoDateTime;
  limit?: number;
  /** Opaque continuation token from a prior `LogPage.nextCursor`. */
  cursor?: string;
}
