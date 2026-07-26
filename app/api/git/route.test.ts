import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { GitProvider } from "@/lib/providers";
import { GitHubError } from "@/lib/providers/git/github/errors";

/**
 * The registry is the handlers' only dependency, so stubbing it is what makes
 * these tests about *the handler* — validation, delegation, status mapping —
 * rather than about GitHub.
 */
const getGitProvider = vi.hoisted(() => vi.fn());
vi.mock("@/lib/providers/registry", () => ({ getGitProvider }));

const { GET: getRepos } = await import("./repos/route");
const { GET: getPrs } = await import("./prs/route");
const { GET: getRuns } = await import("./runs/route");
const { GET: getAlerts } = await import("./alerts/route");
const { GET: getReleases } = await import("./releases/route");

const REPO = "repo://github/acme/checkout-svc";

function url(path: string): Request {
  return new Request(`http://127.0.0.1:7777${path}`);
}

function stubProvider(overrides: Partial<GitProvider> = {}) {
  const provider = {
    listRepos: vi.fn().mockResolvedValue([]),
    listPullRequests: vi.fn().mockResolvedValue([]),
    listWorkflowRuns: vi.fn().mockResolvedValue([]),
    listAlerts: vi.fn().mockResolvedValue([]),
    listReleases: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
  getGitProvider.mockResolvedValue(provider);
  return provider;
}

beforeEach(() => {
  getGitProvider.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("validation happens at the boundary", () => {
  it("rejects a malformed URI with the codec's own message", async () => {
    stubProvider();

    const response = await getPrs(url("/api/git/prs?repo=not-a-uri"));
    const body = (await response.json()) as { error: { message: string } };

    expect(response.status).toBe(400);
    expect(body.error.message).toContain("repo");
    expect(body.error.message).toContain("not-a-uri");
  });

  it("rejects a missing required parameter", async () => {
    stubProvider();

    const response = await getAlerts(url("/api/git/alerts"));

    expect(response.status).toBe(400);
  });

  it("rejects a status outside the shared vocabulary", async () => {
    stubProvider();

    const response = await getRuns(
      url("/api/git/runs?scope=workspace&status=red"),
    );

    expect(response.status).toBe(400);
  });

  it("never reaches the provider when input is invalid", async () => {
    stubProvider();

    await getPrs(url("/api/git/prs?repo=%3A%3Abroken"));

    expect(getGitProvider).not.toHaveBeenCalled();
  });
});

describe("handlers delegate and return, nothing more", () => {
  it("passes the parsed URI and filter through to listPullRequests", async () => {
    const provider = stubProvider();

    await getPrs(
      url(
        `/api/git/prs?repo=${encodeURIComponent(REPO)}&state=open&author=alice&targetBranch=main`,
      ),
    );

    expect(provider.listPullRequests).toHaveBeenCalledWith(REPO, {
      state: "open",
      author: "alice",
      targetBranch: "main",
    });
  });

  it("passes the literal workspace scope through untouched", async () => {
    const provider = stubProvider();

    await getAlerts(url("/api/git/alerts?scope=workspace"));

    expect(provider.listAlerts).toHaveBeenCalledWith("workspace");
  });

  it("coerces limit to a number for listWorkflowRuns", async () => {
    const provider = stubProvider();

    await getRuns(url("/api/git/runs?scope=workspace&limit=5&branch=main"));

    expect(provider.listWorkflowRuns).toHaveBeenCalledWith("workspace", {
      limit: 5,
      branch: "main",
    });
  });

  it("returns the provider's array verbatim — no reshaping in the handler", async () => {
    const repos = [{ uri: REPO, id: "checkout-svc" }];
    stubProvider({
      listRepos: vi.fn().mockResolvedValue(repos),
    } as Partial<GitProvider>);

    const response = await getRepos(url("/api/git/repos"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(repos);
  });

  it("forwards the provider id when one is named", async () => {
    stubProvider();

    await getReleases(
      url(
        `/api/git/releases?repo=${encodeURIComponent(REPO)}&provider=github-oss`,
      ),
    );

    expect(getGitProvider).toHaveBeenCalledWith("github-oss");
  });
});

describe("upstream errors keep their status and their actionable text", () => {
  it("echoes a 401 as a 401, with the message the adapter authored", async () => {
    getGitProvider.mockRejectedValue(
      new GitHubError("401 from GitHub — check GITHUB_TOKEN in your shell.", {
        status: 401,
      }),
    );

    const response = await getRepos(url("/api/git/repos"));
    const body = (await response.json()) as { error: { message: string } };

    expect(response.status).toBe(401);
    // This string is what the panel's ErrorCard renders, unchanged.
    expect(body.error.message).toBe(
      "401 from GitHub — check GITHUB_TOKEN in your shell.",
    );
  });

  it("echoes a rate-limit 429", async () => {
    stubProvider({
      listAlerts: vi
        .fn()
        .mockRejectedValue(
          new GitHubError("GitHub rate limit exhausted.", { status: 429 }),
        ),
    } as Partial<GitProvider>);

    const response = await getAlerts(url("/api/git/alerts?scope=workspace"));

    expect(response.status).toBe(429);
  });

  it("does not render an unexpected error's detail into a panel", async () => {
    stubProvider({
      listRepos: vi
        .fn()
        .mockRejectedValue(new TypeError("cannot read property of undefined")),
    } as Partial<GitProvider>);

    const response = await getRepos(url("/api/git/repos"));
    const body = (await response.json()) as { error: { message: string } };

    expect(response.status).toBe(500);
    expect(body.error.message).not.toContain("cannot read property");
    expect(body.error.message).toContain("server log");
  });
});
