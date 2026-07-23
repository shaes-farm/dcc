import { describe, expect, it } from "vitest";

import { URI_SCHEMES, parseUri, toUri } from "@/lib/domain";
import { SPEC_EXAMPLES } from "@/lib/domain/uri.fixtures";

import { PANEL_IDS } from "./panels";
import { resolveUri } from "./resolve";

describe("every URI opens something", () => {
  /**
   * The acceptance criterion behind everything else here: §3.2 says anything
   * rendered anywhere carries its URI, which is only true if every URI has
   * somewhere to go.
   */
  it.each(SPEC_EXAMPLES)("resolves %s", (example) => {
    const resolution = resolveUri(toUri(example));

    if (resolution.kind === "panel") {
      expect(PANEL_IDS).toContain(resolution.panel);
    } else {
      expect(resolution.actionId).not.toBe("");
    }
  });

  /**
   * The same guard lib/domain/uri.test.ts puts on the codec: a scheme added to
   * URI_SCHEMES with no destination fails here rather than at 2am in the
   * palette. The set must *equal* URI_SCHEMES, not merely be covered by it.
   */
  it("covers every scheme in URI_SCHEMES", () => {
    const covered = new Set(
      SPEC_EXAMPLES.map((example) => parseUri(example).scheme),
    );

    expect([...covered].sort()).toEqual([...URI_SCHEMES].sort());
  });
});

describe("which panel a URI opens", () => {
  const CASES: Array<[uri: string, panel: string]> = [
    ["workspace://commerce", "workspace-health"],
    ["service://checkout", "service-cockpit"],
    ["repo://github/acme/checkout-svc", "repos"],
    ["pr://github/acme/checkout-svc/482", "prs"],
    ["run://github/acme/checkout-svc/9182734", "workflow-runs"],
    ["artifact://npm/@acme/ui-kit@3.7.12", "artifacts"],
    ["alert://github/codeql/1234", "security"],
    ["env://qa", "environments"],
    ["deploy://qa/checkout/2026-07-21T14.32_a1b2c3d", "deploys"],
    ["workload://qa/checkout/deployment/checkout", "pods"],
    ["pod://qa/checkout/checkout-6df4cbf8b", "pod-detail"],
    ["dashboard://grafana/uid-errors", "pinned-dashboard"],
    [
      "doc://repo-md/checkout-svc/runbooks/checkout-oncall.md",
      "document-viewer",
    ],
    ["logs://loki?service=checkout&env=qa", "logs"],
    ["trace://tempo/4bf92f35", "trace-viewer"],
  ];

  it.each(CASES)("%s opens the %s panel", (uri, panel) => {
    const resolution = resolveUri(toUri(uri));

    expect(resolution).toMatchObject({ kind: "panel", panel });
  });

  /**
   * §5.3 ships the two explorers as separate panels, so the API kind — not the
   * scheme — picks between them. The one mapping in the table that is not a
   * constant, and the one most likely to be broken by a careless edit.
   */
  it.each([
    ["api://checkout/rest", "rest-explorer"],
    ["api://checkout/graphql", "graphql-explorer"],
    ["op://checkout/rest/createOrder", "rest-explorer"],
    ["op://checkout/graphql/orders", "graphql-explorer"],
  ])("%s opens the %s panel", (uri, panel) => {
    expect(resolveUri(toUri(uri))).toMatchObject({ kind: "panel", panel });
  });
});

describe("params", () => {
  /**
   * A panel gets the URI's own named parts, not a second vocabulary. Pinning
   * one scheme is enough to state the contract; the codec's own suite proves
   * the parts are read correctly.
   */
  it("hands the panel the parsed URI", () => {
    expect(resolveUri(toUri("pod://qa/checkout/checkout-6df4cbf8b"))).toEqual({
      kind: "panel",
      panel: "pod-detail",
      uri: "pod://qa/checkout/checkout-6df4cbf8b",
      params: {
        scheme: "pod",
        env: "qa",
        namespace: "checkout",
        name: "checkout-6df4cbf8b",
      },
    });
  });

  it("keeps a logs query's scope, nested target and all", () => {
    const uri = toUri(
      "logs://loki?service=checkout&target=workload://qa/checkout/deployment/checkout",
    );

    expect(resolveUri(uri)).toMatchObject({
      panel: "logs",
      params: {
        provider: "loki",
        service: "checkout",
        target: "workload://qa/checkout/deployment/checkout",
      },
    });
  });
});

describe("actions are not panels", () => {
  /**
   * §7.1: an action opens a confirmation dialog, never a view. Resolving one
   * to a panel would put a restart one click from a palette selection, which
   * §5.4 rules out explicitly.
   */
  it("resolves an action to its id and target", () => {
    const uri = toUri(
      "action://restartWorkload?target=workload://qa/checkout/deployment/checkout",
    );

    expect(resolveUri(uri)).toEqual({
      kind: "action",
      uri,
      actionId: "restartWorkload",
      target: "workload://qa/checkout/deployment/checkout",
    });
  });

  it("hands back a target that resolves in its own right", () => {
    const resolution = resolveUri(
      toUri(
        "action://restartWorkload?target=workload://qa/checkout/deployment/checkout",
      ),
    );

    if (resolution.kind !== "action") throw new Error("expected an action");

    expect(resolveUri(resolution.target)).toMatchObject({
      kind: "panel",
      panel: "pods",
    });
  });
});
