import { describe, expect, it } from "vitest";

import { STATUSES, toUri, type Repository } from "@/lib/domain";

import {
  CAPABILITIES,
  hasCapability,
  type ActionResult,
  type Capability,
  type ConnectionResult,
  type GitProvider,
} from ".";

/**
 * The plugin system's load-bearing invariant (§2.2): "no capability, no
 * affordance". There is no Settings/cockpit yet to verify the rendered button
 * against, so we assert it at the data level — a provider that omits an
 * optional method must omit the matching capability id, and `hasCapability`
 * must then read `false`. This is the contract the UI will gate on.
 */

/**
 * A minimal `GitProvider` that supports `list-issues` but NOT `rerun-workflow`:
 * `rerunWorkflow` is absent, and `rerun-workflow` is absent from `capabilities()`.
 * The other methods return empty results — enough to satisfy the interface.
 */
class FakeGitProvider implements GitProvider {
  readonly id = "github";
  readonly kind = "git" as const;
  readonly implementation = "github";
  readonly status = "unknown" as const;

  capabilities(): Capability[] {
    return ["list-issues"];
  }

  async testConnection(): Promise<ConnectionResult> {
    return { ok: true, status: "healthy", checkedAt: "2026-07-23T00:00:00Z" };
  }

  async listRepos(): Promise<Repository[]> {
    return [];
  }
  async listPullRequests() {
    return [];
  }
  async listWorkflowRuns() {
    return [];
  }
  async listAlerts() {
    return [];
  }
  async listReleases() {
    return [];
  }

  // Present because its capability is declared.
  async listIssues() {
    return [];
  }

  // rerunWorkflow is intentionally NOT implemented — see the capability list.
}

describe("capability gating", () => {
  const provider = new FakeGitProvider();

  it("reports a declared capability as present", () => {
    expect(hasCapability(provider, "list-issues")).toBe(true);
  });

  it("reports an undeclared capability as absent — no capability, no affordance", () => {
    expect(hasCapability(provider, "rerun-workflow")).toBe(false);
  });

  it("only declares capabilities whose optional method is actually present", () => {
    // Each capability id names one optional method; if it is declared, that
    // method must exist on the instance.
    const methodFor: Partial<Record<Capability, string>> = {
      "list-issues": "listIssues",
      "rerun-workflow": "rerunWorkflow",
      "restart-workload": "restartWorkload",
      "trigger-deploy": "triggerDeploy",
      "query-metrics": "queryMetrics",
      "search-logs": "searchLogs",
      "get-trace": "getTrace",
      "list-dashboards": "listDashboards",
    };
    for (const capability of provider.capabilities()) {
      const method = methodFor[capability];
      expect(method, `unmapped capability ${capability}`).toBeDefined();
      expect(
        typeof (provider as unknown as Record<string, unknown>)[method!],
      ).toBe("function");
    }
  });
});

describe("provider contract shapes", () => {
  it("testConnection resolves a normalized status", async () => {
    const result = await new FakeGitProvider().testConnection();
    expect(STATUSES).toContain(result.status);
  });

  it("a safe-action result carries the target URI it acted on", () => {
    const result: ActionResult = {
      ok: true,
      at: "2026-07-23T00:00:00Z",
      targetUri: toUri("run://github/acme/checkout-svc/9182734"),
    };
    expect(result.targetUri).toBe("run://github/acme/checkout-svc/9182734");
  });

  it("every capability id is unique", () => {
    expect(new Set(CAPABILITIES).size).toBe(CAPABILITIES.length);
  });
});
