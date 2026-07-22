import type { Status } from "./common";
import type { Uri } from "./uri";

/**
 * The root and the primary object (spec §3.1).
 */

/** The root: one config file, one set of services and providers. */
export interface Workspace {
  uri: Uri;
  /** Display name from config, e.g. "Acme Commerce". */
  name: string;
  /** `env` URI selected by default when a panel needs an environment. */
  defaultEnvironment?: Uri;
}

/**
 * A logical application or component an engineer thinks in — Checkout, UI
 * Library. The primary object: the left rail lists services, and a cockpit is
 * a set of panels bound to one (§5.2).
 *
 * Most fields are *resolved*, not declared. A service can be as small as
 * `{ "id": "checkout" }` in config; the resolver derives the rest by
 * convention (§4.2), and explicit config overrides inference field by field.
 *
 * The reference fields below are the resolved bindings, flattened for the
 * panels that need them directly. The Knowledge Graph
 * (https://github.com/shaes-farm/dcc/issues/10) remains authoritative for
 * *why* each binding exists — declared or inferred, and on what evidence.
 */
export interface Service {
  uri: Uri;
  /** Config-declared id, unique within the workspace. */
  id: string;
  /** Display name; falls back to `id` when config declares none. */
  name?: string;
  /** Rolled up worst-first from everything related to this service (§5.2). */
  status: Status;
  /** `repo` URI. One per service; a repo may back several services. */
  repository?: Uri;
  /** `env` URIs this service was found running in. */
  environments: Uri[];
  /** `api` URIs this service exposes. */
  apis: Uri[];
  /** `dashboard` URIs measuring it. */
  dashboards: Uri[];
  /** Health-check URIs probing it. */
  healthChecks: Uri[];
  /** `doc` URIs explaining it — ADRs, runbooks, READMEs (§6.5). */
  documents: Uri[];
  /** Owners, from CODEOWNERS in v1. Team handles, not user records. */
  owners: string[];
  /**
   * `service` URIs this one calls. Sourced in priority order from OTel
   * service-graph metrics, OpenAPI links, then manual `dependsOn` (§4.2).
   */
  dependsOn: Uri[];
  /** Per-environment base URL, keyed by environment id. */
  baseUrls?: Record<string, string>;
}
