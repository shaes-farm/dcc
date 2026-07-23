import type { IsoDateTime, Severity, Uri } from "@/lib/domain";

/**
 * Log query and result shapes shared by two contracts (§2.2, ADR-0002):
 * `DeploymentProvider.getLogs` tails a workload's own logs, and
 * `ObservabilityProvider.searchLogs` queries an aggregator (Loki). Both hand
 * back a `LogPage`, so it lives here rather than in either provider file.
 *
 * These are *payloads*, not addressable nodes — the addressable `LogStream`
 * (behind `logs://…`) is the domain type; the lines streamed through it are
 * these. That is the domain/provider split (`lib/domain/observability.ts`).
 */

/** One normalized log line. */
export interface LogLine {
  timestamp: IsoDateTime;
  /** Raw message text. */
  message: string;
  /** Log level mapped onto the shared severity ranking; absent when unlabeled. */
  level?: Severity;
  /** `pod` or `workload` URI the line came from, when known. */
  source?: Uri;
  /** Extracted `trace_id`, the hop from a log line to `trace://…` (§6.4). */
  traceId?: string;
  /** Provider-native structured fields, passed through untyped. */
  labels?: Record<string, string>;
}

/**
 * A page of log lines. Log tails are unbounded, so results page with an opaque
 * cursor rather than an offset; a `null`/absent `nextCursor` means the end of
 * the currently available window.
 */
export interface LogPage {
  lines: LogLine[];
  /** Opaque continuation token; pass back as `LogQuery.cursor` for the next page. */
  nextCursor?: string;
}
