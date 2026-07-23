import fc from "fast-check";

import { API_KINDS } from "./api";
import { WORKLOAD_KINDS } from "./workload";
import {
  formatUri,
  type ParsedUri,
  type ParsedUriOf,
  type Uri,
  type UriScheme,
} from "./uri";

/**
 * Test fixtures for §3.2 — the spec's own URIs, and generators for the ones it
 * doesn't write down. Imported by tests only; nothing here ships, and it is
 * deliberately absent from the barrel.
 *
 * It lives beside the codec rather than inside a suite because two suites now
 * assert against it: lib/domain/uri.test.ts (the codec reproduces these bytes)
 * and lib/routing/resolve.test.ts (every one of them opens something). One
 * source, so the two cannot drift apart.
 */

/**
 * Every URI §3.2 writes out, verbatim, with one edit: the spec elides the
 * artifact digest as `sha256:4bf9…`, and an ellipsis is not a digest, so the
 * fixture spells one out. Everything else is byte-for-byte what the spec says.
 *
 * These are the canonical forms. If the codec cannot reproduce one of these
 * exactly, the codec is wrong — not the spec (CLAUDE.md).
 */
export const SPEC_EXAMPLES = [
  "workspace://commerce",
  "service://checkout",
  "repo://github/acme/checkout-svc",
  "pr://github/acme/checkout-svc/482",
  "run://github/acme/checkout-svc/9182734",
  "artifact://ghcr/acme/checkout@sha256:4bf92f3577b34da6a3ce929d0e0e4736",
  "artifact://npm/@acme/ui-kit@3.7.12",
  "alert://github/codeql/1234",
  "env://qa",
  "deploy://qa/checkout/2026-07-21T14.32_a1b2c3d",
  "workload://qa/checkout/deployment/checkout",
  "pod://qa/checkout/checkout-6df4cbf8b",
  "api://checkout/rest",
  "op://checkout/rest/createOrder",
  "dashboard://grafana/uid-errors",
  "doc://repo-md/checkout-svc/docs/adr/0017-extract-pricing.md",
  "doc://repo-md/checkout-svc/runbooks/checkout-oncall.md",
  "logs://loki?service=checkout&env=qa",
  "trace://tempo/4bf92f35",
  "action://restartWorkload?target=workload://qa/checkout/deployment/checkout",
];

// ---------------------------------------------------------------------------
// Generators
//
// The fixtures above are all well-behaved strings. Real ones are not: a
// Kubernetes namespace, a Grafana uid, or a LogQL selector can carry `/`, `%`,
// `?`, `&`, `=`, spaces, and unicode, and every one of those is structure to a
// parser. These are what actually exercise the encoding rules — in the codec,
// and in anything downstream that has to put a URI somewhere else (a URL
// segment, say) and get it back.
// ---------------------------------------------------------------------------

/** Strings chosen to collide with something the grammar treats as structure. */
export const HOSTILE = [
  "a/b", // segment separator
  "100%", // a bare percent
  "%41", // a valid escape that must not decode to "A"
  "%zz", // an invalid escape
  "who?", // start of a query
  "a&b=c", // query separators
  "#hash",
  " leading and trailing ",
  "@at",
  "sha256:4bf9",
  "café",
  "☃",
  "🚀",
  '{app="checkout"}', // a LogQL selector
];

const segment = fc.oneof(
  fc.constantFrom(...HOSTILE),
  fc.string({ minLength: 1 }),
);

/**
 * A path with at least one component, as `doc` carries it.
 *
 * Components are never empty: a leading `/`, a trailing `/`, or a `//` has no
 * file behind it, and the codec rejects one on the way back in. That is a
 * constraint on paths, not a codec bug, so it is excluded here rather than
 * shrugged at.
 */
const path = fc
  .array(segment, { minLength: 1, maxLength: 4 })
  .map((parts) => parts.join("/"))
  .filter((value) => !value.split("/").includes(""));

const digest = fc
  .tuple(
    fc.stringMatching(/^[a-z0-9]{1,8}$/),
    fc.stringMatching(/^[0-9a-f]{1,32}$/),
  )
  .map(([algorithm, hex]) => `${algorithm}:${hex}`);

/**
 * A version that is not also a digest. §3.2 gives the two no marker, so a
 * version literally shaped like `sha256:4bf9` *is* a digest — an ambiguity of
 * the spec's grammar, pinned in uri.test.ts rather than papered over here.
 */
const version = segment.filter((value) => !/^[a-z0-9]+:[0-9a-f]+$/.test(value));

/** Something an action or a log tail can point at. Never itself nested. */
const targetUri: fc.Arbitrary<Uri> = fc
  .tuple(segment, segment, fc.constantFrom(...WORKLOAD_KINDS), segment)
  .map(([env, namespace, kind, name]) =>
    formatUri({ scheme: "workload", env, namespace, kind, name }),
  );

/**
 * One arbitrary per scheme, keyed by scheme so the record is exhaustive the
 * same way the codec's own is: a new scheme fails to compile until it has a
 * generator here too.
 */
export const ARBITRARIES: { [S in UriScheme]: fc.Arbitrary<ParsedUriOf<S>> } = {
  workspace: fc.record({ scheme: fc.constant("workspace"), name: segment }),
  service: fc.record({ scheme: fc.constant("service"), service: segment }),
  repo: fc.record({
    scheme: fc.constant("repo"),
    provider: segment,
    owner: segment,
    name: segment,
  }),
  pr: fc.record({
    scheme: fc.constant("pr"),
    provider: segment,
    owner: segment,
    repo: segment,
    number: fc.nat(),
  }),
  run: fc.record({
    scheme: fc.constant("run"),
    provider: segment,
    owner: segment,
    repo: segment,
    runId: segment,
  }),
  artifact: fc.oneof(
    fc.record({
      scheme: fc.constant("artifact" as const),
      registry: segment,
      name: segment,
      version,
    }),
    fc.record({
      scheme: fc.constant("artifact" as const),
      registry: segment,
      name: segment,
      digest,
    }),
  ),
  alert: fc.record({
    scheme: fc.constant("alert"),
    provider: segment,
    source: segment,
    id: segment,
  }),
  env: fc.record({ scheme: fc.constant("env"), env: segment }),
  deploy: fc.record({
    scheme: fc.constant("deploy"),
    env: segment,
    service: segment,
    deployId: segment,
  }),
  workload: fc.record({
    scheme: fc.constant("workload"),
    env: segment,
    namespace: segment,
    kind: fc.constantFrom(...WORKLOAD_KINDS),
    name: segment,
  }),
  pod: fc.record({
    scheme: fc.constant("pod"),
    env: segment,
    namespace: segment,
    name: segment,
  }),
  api: fc.record({
    scheme: fc.constant("api"),
    service: segment,
    kind: fc.constantFrom(...API_KINDS),
  }),
  op: fc.record({
    scheme: fc.constant("op"),
    service: segment,
    apiKind: fc.constantFrom(...API_KINDS),
    operation: segment,
  }),
  dashboard: fc.record({
    scheme: fc.constant("dashboard"),
    provider: segment,
    uid: segment,
  }),
  doc: fc.record({
    scheme: fc.constant("doc"),
    provider: segment,
    repo: segment,
    path,
  }),
  logs: fc.record(
    {
      scheme: fc.constant("logs" as const),
      provider: segment,
      service: segment,
      env: segment,
      target: targetUri,
      selector: segment,
    },
    { requiredKeys: ["scheme", "provider"] },
  ),
  trace: fc.record({
    scheme: fc.constant("trace"),
    provider: segment,
    traceId: segment,
  }),
  action: fc.record({
    scheme: fc.constant("action"),
    id: segment,
    target: targetUri,
  }),
};

export const anyParsedUri: fc.Arbitrary<ParsedUri> = fc.oneof(
  ...Object.values(ARBITRARIES),
);

/** Any well-formed URI, in canonical form — the parts above, written out. */
export const anyUri: fc.Arbitrary<Uri> = anyParsedUri.map(formatUri);
