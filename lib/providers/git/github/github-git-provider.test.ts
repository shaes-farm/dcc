import { describe, expect, it } from "vitest";

import { toUri, type Uri } from "@/lib/domain";

import { CAPABILITIES, type Capability } from "../../provider";
import { GitHubClient, type FetchLike } from "./client";
import {
  CHECKOUT_COORDS,
  CODE_SCANNING_ALERT,
  DEPENDABOT_ALERT,
  ISSUE,
  ISSUE_THAT_IS_A_PR,
  PULL_REQUEST_NODE,
  PULL_REQUEST_NODE_MERGED,
  REPO_NODE,
  REPO_NODE_DEGRADED,
  SECRET_SCANNING_ALERT,
  STOREFRONT_COORDS,
  WORKFLOW_RUN,
  WORKFLOW_RUN_FAILED,
  WORKFLOW_RUN_IN_PROGRESS,
} from "./github.fixtures";
import { GitHubGitProvider } from "./github-git-provider";

const CHECKOUT: Uri = toUri("repo://github/acme/checkout-svc");

/**
 * Routes by URL substring instead of by call order: `listAlerts` fires its
 * three sources concurrently, so a positional script would be asserting on
 * `Promise.all` scheduling rather than on the adapter.
 */
function routedFetch(routes: Record<string, () => Response>): {
  fetchImpl: FetchLike;
  urls: string[];
} {
  const urls: string[] = [];

  const fetchImpl: FetchLike = (url) => {
    urls.push(url);
    for (const [fragment, respond] of Object.entries(routes)) {
      if (url.includes(fragment)) return Promise.resolve(respond());
    }
    return Promise.resolve(
      new Response(JSON.stringify({ message: "Not Found" }), { status: 404 }),
    );
  };

  return { fetchImpl, urls };
}

function ok(body: unknown): () => Response {
  return () =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
}

function status(code: number, message = "nope"): () => Response {
  return () =>
    new Response(JSON.stringify({ message }), {
      status: code,
      headers: { "content-type": "application/json" },
    });
}

function providerWith(
  routes: Record<string, () => Response>,
  repositories = [CHECKOUT_COORDS, STOREFRONT_COORDS],
) {
  const { fetchImpl, urls } = routedFetch(routes);
  return {
    urls,
    provider: new GitHubGitProvider({
      id: "github",
      repositories,
      client: new GitHubClient({
        credential: { token: "ghp_x", source: "env", tokenEnv: "GITHUB_TOKEN" },
        fetch: fetchImpl,
      }),
    }),
  };
}

describe("capabilities (§2.2 — no capability, no affordance)", () => {
  it("declares only ids the CAPABILITIES union defines", () => {
    const { provider } = providerWith({});

    for (const capability of provider.capabilities()) {
      expect(CAPABILITIES).toContain(capability);
    }
  });

  it("implements a method for every capability it declares", () => {
    // The reflection check from lib/providers/providers.test.ts: a declared
    // capability whose method is missing renders an affordance that throws.
    const { provider } = providerWith({});
    const methods: Record<Capability, keyof GitHubGitProvider | undefined> = {
      "list-issues": "listIssues",
      "rerun-workflow": "rerunWorkflow",
      "restart-workload": undefined,
      "trigger-deploy": undefined,
      "query-metrics": undefined,
      "search-logs": undefined,
      "get-trace": undefined,
      "list-dashboards": undefined,
    };

    for (const capability of provider.capabilities()) {
      const method = methods[capability];
      expect(method).toBeDefined();
      expect(typeof provider[method as keyof GitHubGitProvider]).toBe(
        "function",
      );
    }
  });

  it("is a configured instance as well as an adapter (ProviderAdapter extends Provider)", () => {
    const { provider } = providerWith({});

    expect(provider.id).toBe("github");
    expect(provider.kind).toBe("git");
    expect(provider.implementation).toBe("github");
    expect(provider.status).toBe("unknown");
  });
});

describe("listRepos", () => {
  it("asks for every configured repo in one GraphQL request", async () => {
    const { provider, urls } = providerWith({
      "/graphql": ok({ data: { r0: REPO_NODE, r1: REPO_NODE_DEGRADED } }),
    });

    const repos = await provider.listRepos();

    expect(urls).toHaveLength(1);
    expect(repos.map((repo) => repo.uri)).toEqual([
      "repo://github/acme/checkout-svc",
      "repo://github/acme/storefront",
    ]);
  });

  it("drops a repo the credential cannot see instead of failing the grid", async () => {
    const { provider } = providerWith({
      "/graphql": ok({
        data: { r0: REPO_NODE, r1: null },
        errors: [{ type: "NOT_FOUND", message: "Could not resolve" }],
      }),
    });

    const repos = await provider.listRepos();

    expect(repos).toHaveLength(1);
    expect(repos[0].id).toBe("checkout-svc");
  });

  it("makes no request at all when no repositories are configured", async () => {
    const { provider, urls } = providerWith({}, []);

    await expect(provider.listRepos()).resolves.toEqual([]);
    expect(urls).toHaveLength(0);
  });
});

describe("listPullRequests", () => {
  it("normalizes the PR list for a repo URI", async () => {
    const { provider } = providerWith({
      "/graphql": ok({
        data: {
          repository: {
            pullRequests: {
              nodes: [PULL_REQUEST_NODE, PULL_REQUEST_NODE_MERGED],
            },
          },
        },
      }),
    });

    const prs = await provider.listPullRequests(CHECKOUT);

    expect(prs.map((pr) => pr.number)).toEqual([482, 470]);
    expect(prs[0].checks).toBe("healthy");
  });

  it("post-filters by author, which the connection has no argument for", async () => {
    const { provider } = providerWith({
      "/graphql": ok({
        data: {
          repository: {
            pullRequests: {
              nodes: [PULL_REQUEST_NODE, PULL_REQUEST_NODE_MERGED],
            },
          },
        },
      }),
    });

    const prs = await provider.listPullRequests(CHECKOUT, { author: "alice" });

    expect(prs.map((pr) => pr.number)).toEqual([482]);
  });

  it("rejects a URI for a repo nobody configured, and says how to fix it", async () => {
    const { provider } = providerWith({});

    await expect(
      provider.listPullRequests(toUri("repo://github/acme/unknown-repo")),
    ).rejects.toThrow(/dcc.config.json/);
  });

  it("rejects a URI of the wrong scheme", async () => {
    const { provider } = providerWith({});

    await expect(provider.listPullRequests(toUri("env://qa"))).rejects.toThrow(
      /Expected a repo:\/\/ URI/,
    );
  });
});

describe("listWorkflowRuns", () => {
  it("fans out across every repo for a workspace scope, newest first", async () => {
    const { provider, urls } = providerWith({
      "/actions/runs": ok({
        workflow_runs: [WORKFLOW_RUN, WORKFLOW_RUN_IN_PROGRESS],
      }),
    });

    const runs = await provider.listWorkflowRuns("workspace");

    expect(urls).toHaveLength(2);
    expect(Date.parse(runs[0].startedAt)).toBeGreaterThanOrEqual(
      Date.parse(runs[1].startedAt),
    );
  });

  it("filters on the normalized status, not an upstream conclusion string", async () => {
    const { provider } = providerWith(
      {
        "/actions/runs": ok({
          workflow_runs: [
            WORKFLOW_RUN,
            WORKFLOW_RUN_FAILED,
            WORKFLOW_RUN_IN_PROGRESS,
          ],
        }),
      },
      [CHECKOUT_COORDS],
    );

    const runs = await provider.listWorkflowRuns("workspace", {
      status: "failing",
    });

    expect(runs).toHaveLength(1);
    expect(runs[0].conclusion).toBe("failure");
  });

  it("pushes branch and limit down to the request", async () => {
    const { provider, urls } = providerWith(
      { "/actions/runs": ok({ workflow_runs: [WORKFLOW_RUN] }) },
      [CHECKOUT_COORDS],
    );

    await provider.listWorkflowRuns(CHECKOUT, { branch: "main", limit: 5 });

    expect(urls[0]).toContain("branch=main");
    expect(urls[0]).toContain("per_page=5");
  });
});

describe("listAlerts (§6.1 panel 4)", () => {
  it("merges three sources into one severity-sorted table", async () => {
    const { provider } = providerWith(
      {
        "/dependabot/alerts": ok([DEPENDABOT_ALERT]),
        "/code-scanning/alerts": ok([CODE_SCANNING_ALERT]),
        "/secret-scanning/alerts": ok([SECRET_SCANNING_ALERT]),
      },
      [CHECKOUT_COORDS],
    );

    const alerts = await provider.listAlerts("workspace");

    expect(alerts.map((alert) => alert.source)).toEqual([
      "code-scanning", // critical
      "dependabot", // high
      "secret-scanning", // high
    ]);
    expect(alerts.map((alert) => alert.severity)).toEqual([
      "critical",
      "high",
      "high",
    ]);
  });

  it("keeps the other two sources when one is forbidden or disabled", async () => {
    // Losing `security_events` must not blank the table — merging is the point.
    const { provider } = providerWith(
      {
        "/dependabot/alerts": status(403),
        "/code-scanning/alerts": status(404),
        "/secret-scanning/alerts": ok([SECRET_SCANNING_ALERT]),
      },
      [CHECKOUT_COORDS],
    );

    const alerts = await provider.listAlerts("workspace");

    expect(alerts).toHaveLength(1);
    expect(alerts[0].source).toBe("secret-scanning");
  });

  it("still fails on an error that is not about scope or availability", async () => {
    const { provider } = providerWith(
      { "/alerts": status(401, "Bad credentials") },
      [CHECKOUT_COORDS],
    );

    await expect(provider.listAlerts("workspace")).rejects.toThrow(
      /GITHUB_TOKEN/,
    );
  });

  it("scopes to one repository when handed a repo URI", async () => {
    const { provider, urls } = providerWith({
      "/dependabot/alerts": ok([DEPENDABOT_ALERT]),
      "/code-scanning/alerts": ok([]),
      "/secret-scanning/alerts": ok([]),
    });

    await provider.listAlerts(CHECKOUT);

    expect(urls.every((url) => url.includes("checkout-svc"))).toBe(true);
  });
});

describe("listIssues", () => {
  it("drops the pull requests GET /issues includes", async () => {
    const { provider } = providerWith(
      { "/issues": ok([ISSUE, ISSUE_THAT_IS_A_PR]) },
      [CHECKOUT_COORDS],
    );

    const issues = await provider.listIssues(CHECKOUT);

    expect(issues.map((issue) => issue.number)).toEqual([91]);
  });
});

describe("rerunWorkflow (safe action, §7.1)", () => {
  it("reports success against the run it was handed", async () => {
    const { provider, urls } = providerWith({ "/rerun-failed-jobs": ok({}) }, [
      CHECKOUT_COORDS,
    ]);

    const result = await provider.rerunWorkflow(
      toUri("run://github/acme/checkout-svc/9182734"),
    );

    expect(result.ok).toBe(true);
    expect(result.targetUri).toBe("run://github/acme/checkout-svc/9182734");
    expect(urls[0]).toContain("/actions/runs/9182734/rerun-failed-jobs");
  });

  it("reports the failure rather than throwing, so the dialog can close", async () => {
    const { provider } = providerWith({ "/rerun-failed-jobs": status(403) }, [
      CHECKOUT_COORDS,
    ]);

    const result = await provider.rerunWorkflow(
      toUri("run://github/acme/checkout-svc/9182734"),
    );

    expect(result.ok).toBe(false);
    expect(result.message).toContain("403");
  });

  it("rejects a URI that is not a run", async () => {
    const { provider } = providerWith({});

    await expect(provider.rerunWorkflow(CHECKOUT)).rejects.toThrow(
      /needs a run:\/\/ URI/,
    );
  });
});

describe("testConnection", () => {
  it("probes the cheapest endpoint and reports the remaining quota", async () => {
    const { fetchImpl } = routedFetch({
      "/rate_limit": () =>
        new Response(JSON.stringify({ rate: {} }), {
          status: 200,
          headers: {
            "content-type": "application/json",
            "x-ratelimit-limit": "5000",
            "x-ratelimit-remaining": "4999",
          },
        }),
    });
    const provider = new GitHubGitProvider({
      id: "github",
      repositories: [],
      client: new GitHubClient({
        credential: { token: "ghp_x", source: "gh-cli" },
        fetch: fetchImpl,
      }),
    });

    const result = await provider.testConnection();

    expect(result.ok).toBe(true);
    expect(result.status).toBe("healthy");
    expect(result.message).toContain("4999 of 5000");
  });

  it("reports unknown, not failing, when the probe never completed (§2.2)", async () => {
    const { provider } = providerWith({ "/rate_limit": status(401) });

    const result = await provider.testConnection();

    expect(result.ok).toBe(false);
    expect(result.status).toBe("unknown");
    expect(result.message).toContain("GITHUB_TOKEN");
  });
});
