import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { toUri } from "@/lib/domain";
import { SPEC_EXAMPLES, anyUri } from "@/lib/domain/uri.fixtures";

import { deepLinkPath, parseDeepLink } from "./deep-link";

/** The segment a browser would hand back from a `/r/…` path. */
const segmentOf = (path: string) => path.slice("/r/".length);

describe("the form §3.2 writes down", () => {
  it("mirrors service://checkout as /r/service%3A%2F%2Fcheckout", () => {
    expect(deepLinkPath(toUri("service://checkout"))).toBe(
      "/r/service%3A%2F%2Fcheckout",
    );
  });

  /**
   * One segment, not several. `%2F` staying escaped is what keeps a document
   * path or a nested action target from splitting the route — verified against
   * Next 16, which hands the segment back still encoded.
   */
  it("keeps a document path in a single segment", () => {
    const path = deepLinkPath(
      toUri("doc://repo-md/checkout-svc/docs/adr/0017-extract-pricing.md"),
    );

    expect(segmentOf(path)).not.toContain("/");
  });

  it("keeps a nested action target in a single segment", () => {
    const path = deepLinkPath(
      toUri(
        "action://restartWorkload?target=workload://qa/checkout/deployment/checkout",
      ),
    );

    expect(segmentOf(path)).not.toContain("/");
    expect(segmentOf(path)).not.toContain("?");
    expect(segmentOf(path)).not.toContain("&");
  });
});

describe("round-trip", () => {
  /**
   * The issue's acceptance criterion, as a test: any URI copied from the UI,
   * pasted into the address bar, restores the same view — which is only true if
   * the URL gives back the URI it was written from, byte for byte.
   */
  it.each(SPEC_EXAMPLES)("%s survives the address bar", (example) => {
    const uri = toUri(example);

    expect(parseDeepLink(segmentOf(deepLinkPath(uri)))).toEqual({
      ok: true,
      uri,
    });
  });

  /**
   * The spec's examples are well-behaved. A Kubernetes namespace, a Grafana
   * uid, or a LogQL selector is not: the generator carries `/`, `%`, `?`, `&`,
   * `=`, spaces, and unicode, which is where a URL layer usually loses
   * something. `%` matters most — a URI can already contain its own escapes,
   * so this encodes escapes of escapes.
   */
  it("survives for any URI", () => {
    fc.assert(
      fc.property(anyUri, (uri) => {
        expect(parseDeepLink(segmentOf(deepLinkPath(uri)))).toEqual({
          ok: true,
          uri,
        });
      }),
    );
  });
});

describe("links that arrive broken", () => {
  it("reports a malformed percent-escape without throwing", () => {
    const result = parseDeepLink("service%3A%2F%2Fcheck%zzout");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toMatch(/malformed percent-escape/);
  });

  it("reports an unknown scheme and names the valid ones", () => {
    const result = parseDeepLink(encodeURIComponent("jira://PROJ-1"));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toMatch(/unknown scheme "jira"/);
    expect(result.error.message).toMatch(/service/);
  });

  it("reports a URI that is well-formed but wrong", () => {
    const result = parseDeepLink(encodeURIComponent("repo://github/acme"));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.scheme).toBe("repo");
    expect(result.error.message).toMatch(/expected 3 path segments/);
  });

  it("reports an empty segment rather than resolving nothing", () => {
    expect(parseDeepLink("").ok).toBe(false);
  });
});

describe("canonicalization", () => {
  /**
   * A hand-written link with an uppercase scheme has to land on the same path
   * as one copied from the UI, or the same object has two URLs — and history,
   * favorites, and graph keys all compare URIs with `===`.
   */
  it("reads a non-canonical link back in canonical form", () => {
    const result = parseDeepLink(encodeURIComponent("SERVICE://checkout"));

    expect(result).toEqual({ ok: true, uri: "service://checkout" });
  });

  it("gives a non-canonical link a different path than its canonical form", () => {
    const result = parseDeepLink(encodeURIComponent("SERVICE://checkout"));

    if (!result.ok) throw new Error("expected a URI");
    expect(deepLinkPath(result.uri)).not.toBe(
      `/r/${encodeURIComponent("SERVICE://checkout")}`,
    );
  });
});
