import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  URI_SCHEMES,
  UriFormatError,
  UriParseError,
  formatUri,
  isUri,
  parseUri,
  safeParseUri,
  toUri,
  type ParsedUri,
} from ".";
import { ARBITRARIES, SPEC_EXAMPLES, anyParsedUri } from "./uri.fixtures";

describe("the URIs §3.2 writes down", () => {
  it.each(SPEC_EXAMPLES)("round-trips %s unchanged", (example) => {
    expect(formatUri(parseUri(example))).toBe(example);
  });

  // Guards the codec against the spec growing past it: a scheme added to
  // URI_SCHEMES with no example here fails, which is the cheapest possible
  // reminder that a grammar is missing.
  it("covers every scheme in URI_SCHEMES", () => {
    const covered = new Set(SPEC_EXAMPLES.map((uri) => parseUri(uri).scheme));

    expect([...covered].sort()).toEqual([...URI_SCHEMES].sort());
  });
});

/**
 * Round-tripping proves the codec is self-consistent, not that it reads a URI
 * the way §3.2 means it. These pin the parts themselves, and they are the
 * schemes where a naive `split("/")` gets it wrong.
 */
describe("the parts a URI is read into", () => {
  it("splits an artifact at the last @, so a scoped name survives", () => {
    expect(parseUri("artifact://npm/@acme/ui-kit@3.7.12")).toEqual({
      scheme: "artifact",
      registry: "npm",
      name: "@acme/ui-kit",
      version: "3.7.12",
    });
  });

  it("reads a digest-shaped ref as a digest, not a version", () => {
    expect(parseUri("artifact://ghcr/acme/checkout@sha256:4bf92f35")).toEqual({
      scheme: "artifact",
      registry: "ghcr",
      name: "acme/checkout",
      digest: "sha256:4bf92f35",
    });
  });

  it("keeps a document's path in one piece, slashes and all", () => {
    expect(
      parseUri("doc://repo-md/checkout-svc/docs/adr/0017-extract-pricing.md"),
    ).toEqual({
      scheme: "doc",
      provider: "repo-md",
      repo: "checkout-svc",
      path: "docs/adr/0017-extract-pricing.md",
    });
  });

  it("reads log scope from the query, as config ids", () => {
    expect(parseUri("logs://loki?service=checkout&env=qa")).toEqual({
      scheme: "logs",
      provider: "loki",
      service: "checkout",
      env: "qa",
    });
  });

  it("resolves an action's target as a nested URI", () => {
    expect(
      parseUri(
        "action://restartWorkload?target=workload://qa/checkout/deployment/checkout",
      ),
    ).toEqual({
      scheme: "action",
      id: "restartWorkload",
      target: "workload://qa/checkout/deployment/checkout",
    });
  });

  it("reads a PR number as a number", () => {
    expect(parseUri("pr://github/acme/checkout-svc/482")).toMatchObject({
      number: 482,
    });
  });
});

// ---------------------------------------------------------------------------
// Round-trip property
//
// The fixtures above are all well-behaved strings. Real ones are not, so the
// generators in uri.fixtures.ts carry `/`, `%`, `?`, `&`, `=`, spaces, and
// unicode — every one of them structure to a parser. This is where the
// encoding rules are actually tested.
// ---------------------------------------------------------------------------

describe("round-trip", () => {
  it.each(URI_SCHEMES)(
    "%s: parse(format(parts)) returns the same parts",
    (scheme) => {
      fc.assert(
        fc.property(ARBITRARIES[scheme], (parts) => {
          expect(parseUri(formatUri(parts))).toEqual(parts);
        }),
      );
    },
  );

  it("formats to a URI that is already canonical", () => {
    fc.assert(
      fc.property(anyParsedUri, (parts) => {
        const uri = formatUri(parts);

        expect(toUri(uri)).toBe(uri);
        expect(isUri(uri)).toBe(true);
      }),
    );
  });

  it("canonicalizes idempotently", () => {
    for (const example of SPEC_EXAMPLES) {
      expect(toUri(toUri(example))).toBe(toUri(example));
    }
  });

  // The scheme is the one thing a paste can plausibly get wrong in case — a
  // URI copied out of a document, an email, a chat client.
  it("accepts a scheme in any case and canonicalizes it lowercase", () => {
    expect(toUri("SERVICE://checkout")).toBe("service://checkout");
    expect(toUri("Repo://github/acme/checkout-svc")).toBe(
      "repo://github/acme/checkout-svc",
    );
  });

  // Two spellings of one URI would be two nodes in the Knowledge Graph and two
  // entries in favorites, so decoding is normalization, not just leniency.
  it("decodes escapes that did not need escaping", () => {
    expect(toUri("service://check%6Fut")).toBe("service://checkout");
  });
});

// ---------------------------------------------------------------------------
// Malformed input
//
// "Fails with a useful error rather than a partial parse" is half the issue.
// Every case below asserts both: a UriParseError naming what went wrong, and
// no value at all from safeParseUri — never a shape with a hole in it.
// ---------------------------------------------------------------------------

const MALFORMED: Array<[label: string, input: string, reason: RegExp]> = [
  ["an empty string", "", /missing ":\/\/"/],
  ["free text", "just some text", /missing ":\/\/"/],
  ["a scheme with no separator", "service:checkout", /missing ":\/\/"/],
  ["an unknown scheme", "issue://acme/checkout-svc/91", /unknown scheme/],
  ["a scheme with nothing after it", "service://", /nothing after the scheme/],
  ["too few segments", "repo://github/acme", /expected 3 path segments/],
  ["too many segments", "env://qa/extra", /expected 1 path segment/],
  ["an empty segment", "repo://github//checkout-svc", /empty path segment/],
  [
    "a non-numeric PR number",
    "pr://github/acme/checkout-svc/latest",
    /not a decimal number/,
  ],
  [
    "a zero-padded PR number",
    "pr://github/acme/checkout-svc/0482",
    /not a decimal number/,
  ],
  [
    "a misspelled workload kind",
    "workload://qa/checkout/deploymnt/checkout",
    /unknown workload kind/,
  ],
  ["an unknown API kind", "api://checkout/soap", /unknown API kind/],
  ["an artifact with no ref", "artifact://ghcr/acme/checkout", /missing "@/],
  ["an artifact with no name", "artifact://ghcr@3.7.12", /expected a registry/],
  ["a document with no path", "doc://repo-md/checkout-svc", /expected a prov/],
  [
    "a document path with an empty component",
    "doc://repo-md/checkout-svc/docs//adr.md",
    /empty path segment/,
  ],
  [
    "an unknown query parameter",
    "logs://loki?srvice=checkout",
    /unknown query parameter "srvice"/,
  ],
  [
    "a repeated query parameter",
    "logs://loki?env=qa&env=dev",
    /duplicate query parameter "env"/,
  ],
  ["a valueless query parameter", "logs://loki?service", /has no value/],
  ["an empty query parameter", "logs://loki?service=", /is empty/],
  ["an action with no target", "action://restartWorkload", /missing target/],
  [
    "an action targeting nothing valid",
    "action://restartWorkload?target=workload://qa",
    /target is not a valid URI/,
  ],
  ["a malformed percent-escape", "service://check%zzout", /percent-escape/],
];

describe("malformed URIs", () => {
  it.each(MALFORMED)("rejects %s", (_label, input, reason) => {
    expect(() => parseUri(input)).toThrow(UriParseError);
    expect(() => parseUri(input)).toThrow(reason);
  });

  it.each(MALFORMED)("returns no value at all for %s", (_label, input) => {
    const result = safeParseUri(input);

    expect(result.ok).toBe(false);
    expect(result).not.toHaveProperty("value");
    expect(isUri(input)).toBe(false);
  });

  it("names the input and the scheme it was read as", () => {
    const result = safeParseUri("workload://qa/checkout/deploymnt/checkout");

    if (result.ok) throw new Error("expected the parse to fail");
    expect(result.error.input).toBe(
      "workload://qa/checkout/deploymnt/checkout",
    );
    expect(result.error.scheme).toBe("workload");
    // The valid set belongs in the message: at 2am, "unknown workload kind" on
    // its own sends you to the source to find out what is allowed.
    expect(result.error.message).toContain("deployment");
  });

  it("reports no scheme when the input never had a usable one", () => {
    const result = safeParseUri("nonsense");

    if (result.ok) throw new Error("expected the parse to fail");
    expect(result.error.scheme).toBeUndefined();
  });
});

/**
 * The type system gets the *shape* of the parts right, not their contents:
 * every case below type-checks. Since `formatUri` is the only way to mint a
 * `Uri`, a URI it minted that cannot be read back would make the brand a
 * promise the data breaks — so it refuses instead.
 */
describe("parts that have no URI", () => {
  const UNFORMATTABLE: Array<[label: string, parts: ParsedUri]> = [
    ["an empty segment", { scheme: "service", service: "" }],
    [
      "a negative PR number",
      {
        scheme: "pr",
        provider: "github",
        owner: "acme",
        repo: "checkout-svc",
        number: -1,
      },
    ],
    [
      "a fractional PR number",
      {
        scheme: "pr",
        provider: "github",
        owner: "acme",
        repo: "checkout-svc",
        number: 48.2,
      },
    ],
    [
      "a document path with a missing component",
      {
        scheme: "doc",
        provider: "repo-md",
        repo: "checkout-svc",
        path: "docs//adr.md",
      },
    ],
    [
      "an artifact with no name",
      { scheme: "artifact", registry: "ghcr", name: "", version: "3.7.12" },
    ],
  ];

  it.each(UNFORMATTABLE)("refuses to mint a URI from %s", (_label, parts) => {
    expect(() => formatUri(parts)).toThrow(UriFormatError);
  });

  it("carries the parts, since there is no input string to point at", () => {
    const parts: ParsedUri = { scheme: "env", env: "" };

    try {
      formatUri(parts);
      throw new Error("expected formatUri to refuse");
    } catch (error) {
      if (!(error instanceof UriFormatError)) throw error;
      expect(error.parts).toBe(parts);
      expect(error.message).toContain("env");
    }
  });

  it("mints every URI the parts can actually spell", () => {
    fc.assert(
      fc.property(anyParsedUri, (parts) => {
        expect(() => formatUri(parts)).not.toThrow();
      }),
    );
  });
});
