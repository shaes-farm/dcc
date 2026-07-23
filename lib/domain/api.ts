import type { IsoDateTime, Status } from "./common";
import type { Uri } from "./uri";

/**
 * Ingested API specs and their operations (spec §3.1, §6.3).
 *
 * Swagger 2.0 is converted to OAS3 at ingestion and GraphQL arrives via
 * introspection, so by the time a spec reaches this type the difference
 * between sources is already gone.
 */

export const API_KINDS = ["rest", "graphql"] as const;

export type ApiKind = (typeof API_KINDS)[number];

export interface Api {
  uri: Uri;
  /** Config-declared id, unique within the workspace. */
  id: string;
  kind: ApiKind;
  /** Display name, from the spec title when config declares none. */
  name?: string;
  /** `service` URI exposing this API. */
  service?: Uri;
  /** Where the spec was fetched from. */
  specUrl: string;
  /** Spec-declared version, e.g. OpenAPI `info.version`. */
  specVersion?: string;
  /** Whether the last fetch succeeded — drives the "spec health" badge (§6.3). */
  status: Status;
  fetchedAt?: IsoDateTime;
  /** Base URL per environment id, for the environment picker in the runner. */
  baseUrls?: Record<string, string>;
  operations: Operation[];
}

/**
 * One callable operation. REST operations carry `method` and `path`; GraphQL
 * operations carry `operationType` instead.
 */
export interface Operation {
  uri: Uri;
  /** `api` URI this operation belongs to. */
  api: Uri;
  /** OpenAPI `operationId` or GraphQL field name, e.g. `createOrder`. */
  id: string;
  summary?: string;
  description?: string;
  /** Spec tags — the grouping the operations tree renders (§6.3). */
  tags: string[];
  deprecated?: boolean;
  /** REST only: `GET`, `POST`, … */
  method?: string;
  /** REST only: templated path, e.g. `/orders/{id}`. */
  path?: string;
  /** GraphQL only. */
  operationType?: "query" | "mutation" | "subscription";
}
