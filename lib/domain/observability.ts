import type { IsoDateTime, Status } from "./common";
import type { Uri } from "./uri";

/**
 * The Observe stage (spec §3.0) — the objects the health board, metric panels,
 * log search, and correlation thread address (§6.4).
 *
 * Query and result shapes (`MetricQuery`, `Series`, `LogPage`) belong to the
 * `ObservabilityProvider` contract
 * (https://github.com/shaes-farm/dcc/issues/5), not here. These are the
 * addressable nodes, not the payloads.
 */

/** A metrics view: a pinned Grafana dashboard or a built-in panel. */
export interface Dashboard {
  uri: Uri;
  /** Config-declared id, unique within the workspace. */
  id: string;
  title: string;
  /** `Provider` id serving it, e.g. `grafana`. */
  provider: string;
  /** Provider-side identifier, e.g. a Grafana dashboard uid. */
  externalId?: string;
  /** `service` URIs this dashboard measures. */
  services: Uri[];
  /** Deep link into the provider UI; never block on it being reachable. */
  url?: string;
  /** Whether the panel can be embedded, or must degrade to a link card. */
  embeddable?: boolean;
}

/**
 * An HTTP probe with an expected status, probed from the BFF rather than the
 * browser (§6.4 panel 1). The health board must render meaningfully with only
 * these configured — no Prometheus or Loki required.
 *
 * Carries no `uri`: §3.2 defines no scheme for health checks, so they are
 * reached through the service they cover. See the note in `git.ts`.
 */
export interface HealthCheck {
  /** Config-declared id, unique within the workspace. */
  id: string;
  name: string;
  url: string;
  expectStatus: number;
  /** `service` URI this probe covers. */
  service?: Uri;
  status: Status;
  /** Status code from the last probe; absent if the request never completed. */
  lastStatusCode?: number;
  lastLatencyMs?: number;
  lastCheckedAt?: IsoDateTime;
  /** When the status last changed — "how long has this been red?" */
  lastChangedAt?: IsoDateTime;
}

/**
 * A queryable log scope, not the logs themselves: the addressable thing behind
 * `logs://loki?service=checkout&env=qa`. Log lines arrive as a provider
 * result page, streamed over SSE.
 */
export interface LogStream {
  uri: Uri;
  /** `Provider` id serving the logs, e.g. `loki`. */
  provider: string;
  /** `service` URI the scope is narrowed to. */
  service?: Uri;
  /** `env` URI the scope is narrowed to. */
  environment?: Uri;
  /** `workload` or `pod` URI, for a tail scoped tighter than a service. */
  target?: Uri;
  /** Provider-native selector, e.g. a LogQL matcher. */
  selector?: string;
}

/** One span within a trace. */
export interface TraceSpan {
  spanId: string;
  parentSpanId?: string;
  name: string;
  /** Emitting service name as instrumented, which may not match a config id. */
  serviceName?: string;
  startedAt: IsoDateTime;
  durationMs: number;
  /** Whether the span carries an error status. */
  error?: boolean;
}

/** A distributed trace, reached from a log line carrying a `trace_id` (§6.4). */
export interface Trace {
  uri: Uri;
  traceId: string;
  /** `Provider` id serving it, e.g. `tempo`. */
  provider: string;
  startedAt: IsoDateTime;
  durationMs: number;
  /** `service` URI where the trace begins, once matched. */
  rootService?: Uri;
  spans: TraceSpan[];
}
