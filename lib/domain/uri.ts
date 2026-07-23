/**
 * Resource URIs (spec §3.2) — the address of every instance of every canonical
 * object.
 *
 * Anything rendered anywhere carries its URI, and navigation history,
 * favorites, layout presets, and Knowledge Graph edges all store URIs and
 * nothing else. That is what keeps ad-hoc object shapes out of persisted state
 * and makes future plugins trivial: contribute a scheme and a panel, and
 * linking works.
 *
 * This module owns the *type*; the parse/format codec lands with
 * https://github.com/shaes-farm/dcc/issues/3.
 */

/**
 * Every URI scheme in the workspace (§3.2).
 *
 * ```
 * workspace://commerce                              service://checkout
 * repo://github/acme/checkout-svc                   pr://github/acme/checkout-svc/482
 * run://github/acme/checkout-svc/9182734            artifact://ghcr/acme/checkout@sha256:4bf9…
 * alert://github/codeql/1234                        env://qa
 * deploy://qa/checkout/2026-07-21T14.32_a1b2c3d     workload://qa/checkout/deployment/checkout
 * pod://qa/checkout/checkout-6df4cbf8b              api://checkout/rest
 * op://checkout/rest/createOrder                    dashboard://grafana/uid-errors
 * doc://repo-md/checkout-svc/docs/adr/0017.md       logs://loki?service=checkout&env=qa
 * trace://tempo/4bf92f35                            action://restartWorkload?target=workload://…
 * ```
 */
export const URI_SCHEMES = [
  "workspace",
  "service",
  "repo",
  "pr",
  "run",
  "artifact",
  "alert",
  "env",
  "deploy",
  "workload",
  "pod",
  "api",
  "op",
  "dashboard",
  "doc",
  "logs",
  "trace",
  "action",
] as const;

export type UriScheme = (typeof URI_SCHEMES)[number];

declare const uriBrand: unique symbol;

/**
 * A resource URI.
 *
 * Branded rather than a bare `string` alias so a raw string can never drift
 * into a URI field: values come from the codec (#3), which is the only thing
 * that knows a scheme's grammar.
 */
export type Uri = string & { readonly [uriBrand]: true };

/**
 * Asserts that a string is a well-formed URI without checking it.
 *
 * A stopgap for fixtures and literals until the codec (#3) ships `format()`,
 * which builds URIs from typed parts and is the only thing that should mint
 * them afterwards. Every call site here is a call site to migrate.
 *
 * @internal
 */
export function unsafeUri(value: string): Uri {
  return value as Uri;
}
