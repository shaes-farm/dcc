import { API_KINDS, type ApiKind } from "./api";
import { WORKLOAD_KINDS, type WorkloadKind } from "./workload";

/**
 * Resource URIs (spec §3.2) — the address of every instance of every canonical
 * object, and the codec that reads and writes them.
 *
 * Anything rendered anywhere carries its URI, and navigation history,
 * favorites, layout presets, and Knowledge Graph edges all store URIs and
 * nothing else. That is what keeps ad-hoc object shapes out of persisted state
 * and makes future plugins trivial: contribute a scheme and a panel, and
 * linking works.
 *
 * This module is the only thing that knows a scheme's grammar. `formatUri` is
 * the only way to mint a `Uri`; `parseUri` and `safeParseUri` are the only way
 * to read one.
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
 * into a URI field: values come from `formatUri` or `toUri`, which are the
 * only things that know a scheme's grammar.
 */
export type Uri = string & { readonly [uriBrand]: true };

/**
 * A URI taken apart into its named pieces, discriminated on `scheme`.
 *
 * Parts are named after the domain fields they populate, so a provider
 * normalizing an upstream payload builds the same words it already has. The
 * union is exhaustive over `URI_SCHEMES`, which is what lets the resolver
 * (https://github.com/shaes-farm/dcc/issues/4) switch on `scheme` and have the
 * compiler prove no case is missing.
 */
export type ParsedUri =
  /** `workspace://commerce` */
  | { scheme: "workspace"; name: string }
  /** `service://checkout` */
  | { scheme: "service"; service: string }
  /** `repo://github/acme/checkout-svc` */
  | { scheme: "repo"; provider: string; owner: string; name: string }
  /** `pr://github/acme/checkout-svc/482` */
  | {
      scheme: "pr";
      provider: string;
      owner: string;
      repo: string;
      number: number;
    }
  /** `run://github/acme/checkout-svc/9182734` */
  | {
      scheme: "run";
      provider: string;
      owner: string;
      repo: string;
      /** String, not number: run ids are opaque and outgrow `number` upstream. */
      runId: string;
    }
  /**
   * `artifact://ghcr/acme/checkout@sha256:4bf9…`,
   * `artifact://npm/@acme/ui-kit@3.7.12`
   *
   * Exactly one of `version` or `digest` is present — a registry reference is
   * one or the other, and modeling both as optional would let a caller mint an
   * artifact URI with neither. Which one a URI carries is read back off its
   * shape (`sha256:4bf9…` is a digest), since §3.2 gives them no marker.
   */
  | ({ scheme: "artifact"; registry: string; name: string } & (
      { version: string; digest?: never } | { digest: string; version?: never }
    ))
  /** `alert://github/codeql/1234` */
  | { scheme: "alert"; provider: string; source: string; id: string }
  /** `env://qa` */
  | { scheme: "env"; env: string }
  /** `deploy://qa/checkout/2026-07-21T14.32_a1b2c3d` */
  | { scheme: "deploy"; env: string; service: string; deployId: string }
  /** `workload://qa/checkout/deployment/checkout` */
  | {
      scheme: "workload";
      env: string;
      namespace: string;
      kind: WorkloadKind;
      name: string;
    }
  /** `pod://qa/checkout/checkout-6df4cbf8b` */
  | { scheme: "pod"; env: string; namespace: string; name: string }
  /** `api://checkout/rest` */
  | { scheme: "api"; service: string; kind: ApiKind }
  /** `op://checkout/rest/createOrder` */
  | { scheme: "op"; service: string; apiKind: ApiKind; operation: string }
  /** `dashboard://grafana/uid-errors` */
  | { scheme: "dashboard"; provider: string; uid: string }
  /**
   * `doc://repo-md/checkout-svc/docs/adr/0017-extract-pricing.md`
   *
   * `path` is repository-relative and keeps its `/`. Its components are never
   * empty — no leading or trailing `/`, no `//` — since there is no file
   * behind one.
   */
  | { scheme: "doc"; provider: string; repo: string; path: string }
  /**
   * `logs://loki?service=checkout&env=qa`
   *
   * Query values are config ids, not URIs — they mirror `LogStream`, where the
   * scope is "which service, in which environment". `target` is the exception:
   * a tail scoped tighter than a service points at a `workload` or `pod`.
   */
  | {
      scheme: "logs";
      provider: string;
      service?: string;
      env?: string;
      target?: Uri;
      selector?: string;
    }
  /** `trace://tempo/4bf92f35` */
  | { scheme: "trace"; provider: string; traceId: string }
  /** `action://restartWorkload?target=workload://qa/checkout/deployment/checkout` */
  | { scheme: "action"; id: string; target: Uri };

/** The member of `ParsedUri` for one scheme. */
export type ParsedUriOf<S extends UriScheme> = Extract<
  ParsedUri,
  { scheme: S }
>;

/**
 * A URI that could not be read.
 *
 * Carries the offending input and, once the scheme is known, which grammar
 * rejected it — "malformed URI" alone is useless at 2am when the string came
 * out of a paste buffer.
 */
export class UriParseError extends Error {
  readonly input: string;
  /** Absent when the input failed before a scheme could be identified. */
  readonly scheme?: UriScheme;

  constructor(input: string, reason: string, scheme?: UriScheme) {
    super(
      scheme
        ? `Invalid ${scheme} URI ${JSON.stringify(input)}: ${reason}`
        : `Invalid URI ${JSON.stringify(input)}: ${reason}`,
    );
    this.name = "UriParseError";
    this.input = input;
    this.scheme = scheme;
  }
}

/** The result of a parse that is allowed to fail — see `safeParseUri`. */
export type UriParseResult =
  { ok: true; value: ParsedUri } | { ok: false; error: UriParseError };

/**
 * Reads a URI into its parts, throwing `UriParseError` if it is malformed.
 *
 * Strict apart from two normalizations: the scheme is matched
 * case-insensitively, and percent-escapes are decoded. A URI never parses
 * partially — either every part is valid or nothing comes back.
 */
export function parseUri(input: string): ParsedUri {
  const separator = input.indexOf("://");
  if (separator === -1) {
    throw new UriParseError(input, 'missing "://" after the scheme');
  }

  const rawScheme = input.slice(0, separator).toLowerCase();
  const scheme = URI_SCHEMES.find((known) => known === rawScheme);
  if (!scheme) {
    throw new UriParseError(
      input,
      `unknown scheme ${JSON.stringify(rawScheme)} — expected one of ${URI_SCHEMES.join(", ")}`,
    );
  }

  const body = input.slice(separator + "://".length);
  if (body === "") {
    throw new UriParseError(input, "nothing after the scheme", scheme);
  }

  return SCHEME_CODECS[scheme].parse(body, input);
}

/**
 * Reads a URI, returning a result instead of throwing.
 *
 * The palette accepts arbitrary pasted text and route handlers accept
 * arbitrary query strings; neither should have to wrap a paste in try/catch.
 */
export function safeParseUri(input: string): UriParseResult {
  try {
    return { ok: true, value: parseUri(input) };
  } catch (error) {
    if (error instanceof UriParseError) return { ok: false, error };
    throw error;
  }
}

/**
 * Writes parts back out as a URI. The only way to mint a `Uri`.
 *
 * Output is canonical: the same parts always produce the same bytes, which is
 * what lets URIs be compared with `===`, used as `Map` keys in the Knowledge
 * Graph, and deduplicated in favorites.
 */
export function formatUri(parsed: ParsedUri): Uri {
  const codec = SCHEME_CODECS[parsed.scheme];
  // The record is keyed by scheme and `parsed` is discriminated on it, but
  // TypeScript cannot correlate the two across an index access.
  return `${parsed.scheme}://${codec.format(parsed as never)}` as Uri;
}

/**
 * Validates a string and returns it in canonical form.
 *
 * The entry point for URIs arriving from outside — config, a pasted link, a
 * route-handler query param. Throws `UriParseError` if the string is not a
 * URI; use `safeParseUri` where failure is expected.
 */
export function toUri(input: string): Uri {
  return formatUri(parseUri(input));
}

/** Whether a string is a well-formed URI, narrowing it to `Uri` if so. */
export function isUri(value: string): value is Uri {
  return safeParseUri(value).ok;
}

// ---------------------------------------------------------------------------
// Encoding
//
// Canonical form is the spec's own form, byte for byte: every example in §3.2
// round-trips to itself. That rules out `encodeURIComponent` and
// `URLSearchParams`, both of which escape characters §3.2 writes literally —
// `@` in `artifact://npm/@acme/ui-kit@3.7.12`, and `:` and `/` in
// `action://restartWorkload?target=workload://…`. So escaping is minimal: only
// the characters that would otherwise be read as structure, plus anything
// invisible.
// ---------------------------------------------------------------------------

/** Whitespace and control characters: never legible, always escaped. */
const INVISIBLE = "\\s\\u0000-\\u001f\\u007f";

/** Escaped inside a path segment: the separators, plus `%` itself. */
const SEGMENT_RESERVED = new RegExp(`[%/?#${INVISIBLE}]`, "g");

/** Escaped inside a query value. `:` and `/` stay literal so nested URIs do. */
const QUERY_RESERVED = new RegExp(`[%&=#?${INVISIBLE}]`, "g");

/**
 * Escaped inside an artifact name and ref. Both keep `/` — `acme/checkout` is
 * one coordinate, not two segments — and the name keeps `@` as well, since the
 * ref is split off at the *last* one.
 */
const ARTIFACT_NAME_RESERVED = new RegExp(`[%?#${INVISIBLE}]`, "g");
const ARTIFACT_REF_RESERVED = new RegExp(`[%?#@${INVISIBLE}]`, "g");

const ENCODER = new TextEncoder();

function escapeWith(value: string, reserved: RegExp): string {
  return value.replace(reserved, (character) =>
    [...ENCODER.encode(character)]
      .map((byte) => `%${byte.toString(16).toUpperCase().padStart(2, "0")}`)
      .join(""),
  );
}

const encodeSegment = (value: string) => escapeWith(value, SEGMENT_RESERVED);
const encodeQueryValue = (value: string) => escapeWith(value, QUERY_RESERVED);

function decode(value: string, input: string, scheme: UriScheme): string {
  try {
    return decodeURIComponent(value);
  } catch {
    throw new UriParseError(
      input,
      `malformed percent-escape in ${JSON.stringify(value)}`,
      scheme,
    );
  }
}

// ---------------------------------------------------------------------------
// Shared grammar helpers
// ---------------------------------------------------------------------------

interface SchemeCodec<S extends UriScheme = UriScheme> {
  parse(body: string, input: string): ParsedUriOf<S>;
  format(parsed: ParsedUriOf<S>): string;
}

/**
 * Splits the body into exactly `count` non-empty segments and decodes them.
 *
 * Arity is part of the grammar, so a URI with one segment too few fails here
 * rather than parsing into a shape with an `undefined` in it.
 */
function segments(
  body: string,
  count: number,
  input: string,
  scheme: UriScheme,
): string[] {
  const parts = body.split("/");
  if (parts.length !== count) {
    throw new UriParseError(
      input,
      `expected ${count} path segment${count === 1 ? "" : "s"}, found ${parts.length}`,
      scheme,
    );
  }
  if (parts.some((part) => part === "")) {
    throw new UriParseError(input, "empty path segment", scheme);
  }
  return parts.map((part) => decode(part, input, scheme));
}

/** Splits a body at the first `?`, if it has one. */
function splitQuery(body: string): [head: string, query: string | undefined] {
  const mark = body.indexOf("?");
  return mark === -1
    ? [body, undefined]
    : [body.slice(0, mark), body.slice(mark + 1)];
}

/**
 * Reads a query string into decoded key/value pairs.
 *
 * Keys are closed per scheme: an unrecognized key is a parse error, never a
 * silently dropped one, because a dropped `env=` would quietly widen a log
 * tail from one environment to all of them.
 */
function queryParameters(
  raw: string | undefined,
  allowed: readonly string[],
  input: string,
  scheme: UriScheme,
): Record<string, string> {
  const result: Record<string, string> = {};
  if (raw === undefined || raw === "") return result;

  for (const pair of raw.split("&")) {
    const equals = pair.indexOf("=");
    if (equals === -1) {
      throw new UriParseError(
        input,
        `query parameter ${JSON.stringify(pair)} has no value`,
        scheme,
      );
    }

    const key = decode(pair.slice(0, equals), input, scheme);
    if (!allowed.includes(key)) {
      throw new UriParseError(
        input,
        `unknown query parameter ${JSON.stringify(key)} — expected one of ${allowed.join(", ")}`,
        scheme,
      );
    }
    if (key in result) {
      throw new UriParseError(
        input,
        `duplicate query parameter ${JSON.stringify(key)}`,
        scheme,
      );
    }

    const value = decode(pair.slice(equals + 1), input, scheme);
    if (value === "") {
      throw new UriParseError(
        input,
        `query parameter ${JSON.stringify(key)} is empty`,
        scheme,
      );
    }
    result[key] = value;
  }

  return result;
}

/** Emits query pairs in declared order — §3.2 writes `service` before `env`. */
function formatQuery(pairs: Array<[string, string | undefined]>): string {
  const present = pairs.filter(
    (pair): pair is [string, string] => pair[1] !== undefined,
  );
  return present.length === 0
    ? ""
    : `?${present
        .map(([key, value]) => `${key}=${encodeQueryValue(value)}`)
        .join("&")}`;
}

/** Resolves a nested URI carried in a query value, e.g. an action's target. */
function nestedUri(
  value: string,
  label: string,
  input: string,
  scheme: UriScheme,
): Uri {
  const nested = safeParseUri(value);
  if (!nested.ok) {
    throw new UriParseError(
      input,
      `${label} is not a valid URI (${nested.error.message})`,
      scheme,
    );
  }
  return formatUri(nested.value);
}

/** A member of a closed union, or a parse error naming the valid set. */
function oneOf<T extends string>(
  value: string,
  values: readonly T[],
  label: string,
  input: string,
  scheme: UriScheme,
): T {
  const match = values.find((known) => known === value);
  if (!match) {
    throw new UriParseError(
      input,
      `unknown ${label} ${JSON.stringify(value)} — expected one of ${values.join(", ")}`,
      scheme,
    );
  }
  return match;
}

/**
 * A canonical decimal, e.g. a PR number.
 *
 * Rejects `0482` and `+482` as well as `abc`: they parse to the same number
 * but format back to different bytes, so two URIs for one PR would compare
 * unequal as `Map` keys in the Knowledge Graph.
 */
function integer(
  value: string,
  label: string,
  input: string,
  scheme: UriScheme,
): number {
  if (!/^(0|[1-9][0-9]*)$/.test(value)) {
    throw new UriParseError(
      input,
      `${label} ${JSON.stringify(value)} is not a decimal number`,
      scheme,
    );
  }
  return Number(value);
}

/** A digest reference, e.g. `sha256:4bf9…`, as opposed to a version. */
const DIGEST = /^[a-z0-9]+:[0-9a-f]+$/;

// ---------------------------------------------------------------------------
// Per-scheme grammars
// ---------------------------------------------------------------------------

/**
 * The grammar of every scheme, one entry each.
 *
 * Keyed by `UriScheme`, so adding a scheme to `URI_SCHEMES` without teaching
 * the codec its grammar is a type error rather than a runtime surprise.
 */
const SCHEME_CODECS: { [S in UriScheme]: SchemeCodec<S> } = {
  workspace: {
    parse: (body, input) => ({
      scheme: "workspace",
      name: segments(body, 1, input, "workspace")[0],
    }),
    format: ({ name }) => encodeSegment(name),
  },

  service: {
    parse: (body, input) => ({
      scheme: "service",
      service: segments(body, 1, input, "service")[0],
    }),
    format: ({ service }) => encodeSegment(service),
  },

  repo: {
    parse: (body, input) => {
      const [provider, owner, name] = segments(body, 3, input, "repo");
      return { scheme: "repo", provider, owner, name };
    },
    format: ({ provider, owner, name }) =>
      [provider, owner, name].map(encodeSegment).join("/"),
  },

  pr: {
    parse: (body, input) => {
      const [provider, owner, repo, number] = segments(body, 4, input, "pr");
      return {
        scheme: "pr",
        provider,
        owner,
        repo,
        number: integer(number, "pull request number", input, "pr"),
      };
    },
    format: ({ provider, owner, repo, number }) =>
      `${[provider, owner, repo].map(encodeSegment).join("/")}/${number}`,
  },

  run: {
    parse: (body, input) => {
      const [provider, owner, repo, runId] = segments(body, 4, input, "run");
      return { scheme: "run", provider, owner, repo, runId };
    },
    format: ({ provider, owner, repo, runId }) =>
      [provider, owner, repo, runId].map(encodeSegment).join("/"),
  },

  /**
   * `artifact://<registry>/<name>@<ref>`, where the name itself may contain
   * both `/` and `@` — `artifact://npm/@acme/ui-kit@3.7.12` is a scoped
   * package. So the name runs from the first `/` to the *last* `@`, and the
   * ref is a digest when it looks like one and a version otherwise.
   */
  artifact: {
    parse: (body, input) => {
      const slash = body.indexOf("/");
      if (slash === -1) {
        throw new UriParseError(
          input,
          "expected a registry and a name",
          "artifact",
        );
      }

      const at = body.lastIndexOf("@");
      if (at < slash) {
        throw new UriParseError(
          input,
          'missing "@version" or "@digest"',
          "artifact",
        );
      }

      const registry = decode(body.slice(0, slash), input, "artifact");
      const name = decode(body.slice(slash + 1, at), input, "artifact");
      const ref = decode(body.slice(at + 1), input, "artifact");
      if (registry === "" || name === "" || ref === "") {
        throw new UriParseError(
          input,
          "registry, name, and version or digest are all required",
          "artifact",
        );
      }

      return DIGEST.test(ref)
        ? { scheme: "artifact", registry, name, digest: ref }
        : { scheme: "artifact", registry, name, version: ref };
    },
    format: (parsed) =>
      [
        encodeSegment(parsed.registry),
        "/",
        escapeWith(parsed.name, ARTIFACT_NAME_RESERVED),
        "@",
        escapeWith(parsed.digest ?? parsed.version, ARTIFACT_REF_RESERVED),
      ].join(""),
  },

  alert: {
    parse: (body, input) => {
      const [provider, source, id] = segments(body, 3, input, "alert");
      return { scheme: "alert", provider, source, id };
    },
    format: ({ provider, source, id }) =>
      [provider, source, id].map(encodeSegment).join("/"),
  },

  env: {
    parse: (body, input) => ({
      scheme: "env",
      env: segments(body, 1, input, "env")[0],
    }),
    format: ({ env }) => encodeSegment(env),
  },

  deploy: {
    parse: (body, input) => {
      const [env, service, deployId] = segments(body, 3, input, "deploy");
      return { scheme: "deploy", env, service, deployId };
    },
    format: ({ env, service, deployId }) =>
      [env, service, deployId].map(encodeSegment).join("/"),
  },

  workload: {
    parse: (body, input) => {
      const [env, namespace, kind, name] = segments(body, 4, input, "workload");
      return {
        scheme: "workload",
        env,
        namespace,
        kind: oneOf(kind, WORKLOAD_KINDS, "workload kind", input, "workload"),
        name,
      };
    },
    format: ({ env, namespace, kind, name }) =>
      [env, namespace, kind, name].map(encodeSegment).join("/"),
  },

  pod: {
    parse: (body, input) => {
      const [env, namespace, name] = segments(body, 3, input, "pod");
      return { scheme: "pod", env, namespace, name };
    },
    format: ({ env, namespace, name }) =>
      [env, namespace, name].map(encodeSegment).join("/"),
  },

  api: {
    parse: (body, input) => {
      const [service, kind] = segments(body, 2, input, "api");
      return {
        scheme: "api",
        service,
        kind: oneOf(kind, API_KINDS, "API kind", input, "api"),
      };
    },
    format: ({ service, kind }) => `${encodeSegment(service)}/${kind}`,
  },

  op: {
    parse: (body, input) => {
      const [service, apiKind, operation] = segments(body, 3, input, "op");
      return {
        scheme: "op",
        service,
        apiKind: oneOf(apiKind, API_KINDS, "API kind", input, "op"),
        operation,
      };
    },
    format: ({ service, apiKind, operation }) =>
      `${encodeSegment(service)}/${apiKind}/${encodeSegment(operation)}`,
  },

  dashboard: {
    parse: (body, input) => {
      const [provider, uid] = segments(body, 2, input, "dashboard");
      return { scheme: "dashboard", provider, uid };
    },
    format: ({ provider, uid }) =>
      `${encodeSegment(provider)}/${encodeSegment(uid)}`,
  },

  /**
   * `doc://<provider>/<repo>/<path…>` — the tail is a repository-relative file
   * path, so its `/` are meaningful and stay literal. That keeps the URI
   * readable and lets it carry `Document.path` unchanged.
   */
  doc: {
    parse: (body, input) => {
      const parts = body.split("/");
      if (parts.length < 3) {
        throw new UriParseError(
          input,
          `expected a provider, a repository, and a path, found ${parts.length} segment${parts.length === 1 ? "" : "s"}`,
          "doc",
        );
      }
      if (parts.some((part) => part === "")) {
        throw new UriParseError(input, "empty path segment", "doc");
      }

      const [provider, repo, ...path] = parts.map((part) =>
        decode(part, input, "doc"),
      );
      return { scheme: "doc", provider, repo, path: path.join("/") };
    },
    format: ({ provider, repo, path }) =>
      [provider, repo, ...path.split("/")].map(encodeSegment).join("/"),
  },

  logs: {
    parse: (body, input) => {
      const [head, raw] = splitQuery(body);
      const [provider] = segments(head, 1, input, "logs");
      const values = queryParameters(
        raw,
        ["service", "env", "target", "selector"],
        input,
        "logs",
      );

      return {
        scheme: "logs",
        provider,
        service: values.service,
        env: values.env,
        target:
          values.target === undefined
            ? undefined
            : nestedUri(values.target, "target", input, "logs"),
        selector: values.selector,
      };
    },
    format: ({ provider, service, env, target, selector }) =>
      encodeSegment(provider) +
      formatQuery([
        ["service", service],
        ["env", env],
        ["target", target],
        ["selector", selector],
      ]),
  },

  trace: {
    parse: (body, input) => {
      const [provider, traceId] = segments(body, 2, input, "trace");
      return { scheme: "trace", provider, traceId };
    },
    format: ({ provider, traceId }) =>
      `${encodeSegment(provider)}/${encodeSegment(traceId)}`,
  },

  /**
   * `action://<id>?target=<uri>` — the target is a nested URI, parsed
   * recursively. An action without a resolvable target is unexecutable, so a
   * bad one fails here rather than in a confirmation dialog (§7.1).
   */
  action: {
    parse: (body, input) => {
      const [head, raw] = splitQuery(body);
      const [id] = segments(head, 1, input, "action");
      const values = queryParameters(raw, ["target"], input, "action");

      if (values.target === undefined) {
        throw new UriParseError(input, "missing target", "action");
      }

      return {
        scheme: "action",
        id,
        target: nestedUri(values.target, "target", input, "action"),
      };
    },
    format: ({ id, target }) =>
      `${encodeSegment(id)}${formatQuery([["target", target]])}`,
  },
};
