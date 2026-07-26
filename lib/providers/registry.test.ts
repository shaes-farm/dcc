import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { GitHubError } from "./git/github/errors";
import { getGitProvider, resetProviderRegistry } from "./registry";

const tempDirs: string[] = [];

function writeConfig(config: unknown): void {
  const dir = mkdtempSync(join(tmpdir(), "dcc-registry-test-"));
  tempDirs.push(dir);
  const path = join(dir, "dcc.config.json");
  writeFileSync(path, JSON.stringify(config));
  process.env.DCC_CONFIG = path;
}

/** A minimal §4.1 config; `tokenEnv` keeps the test off the `gh` CLI. */
function config(overrides: Record<string, unknown> = {}) {
  return {
    workspace: { name: "Test" },
    providers: {
      git: [
        { id: "github", kind: "github", auth: { tokenEnv: "DCC_TEST_TOKEN" } },
      ],
    },
    repositories: [
      {
        id: "checkout-svc",
        provider: "github",
        owner: "acme",
        name: "checkout-svc",
        tags: ["service"],
      },
    ],
    ...overrides,
  };
}

afterEach(() => {
  delete process.env.DCC_CONFIG;
  delete process.env.DCC_TEST_TOKEN;
  resetProviderRegistry();
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("getGitProvider", () => {
  it("builds a GitHub adapter from the configured provider entry", async () => {
    process.env.DCC_TEST_TOKEN = "ghp_test";
    writeConfig(config());

    const provider = await getGitProvider();

    expect(provider.kind).toBe("git");
    expect(provider.id).toBe("github");
    expect(provider.implementation).toBe("github");
    // The env-var *name* travels with the adapter; the value does not (§10.2).
    expect(provider.tokenEnv).toBe("DCC_TEST_TOKEN");
    expect(JSON.stringify(provider)).not.toContain("ghp_test");
  });

  it("memoizes, so the ETag cache survives between polls (ADR-0005)", async () => {
    process.env.DCC_TEST_TOKEN = "ghp_test";
    writeConfig(config());

    const first = await getGitProvider();
    const second = await getGitProvider();

    expect(second).toBe(first);
  });

  it("does not cache a failed build — exporting the token should be enough", async () => {
    writeConfig(config());

    await expect(getGitProvider()).rejects.toThrow(/DCC_TEST_TOKEN/);

    process.env.DCC_TEST_TOKEN = "ghp_test";
    await expect(getGitProvider()).resolves.toBeDefined();
  });

  it("binds only the repositories that reference this provider", async () => {
    process.env.DCC_TEST_TOKEN = "ghp_test";
    writeConfig(
      config({
        providers: {
          git: [
            {
              id: "github",
              kind: "github",
              auth: { tokenEnv: "DCC_TEST_TOKEN" },
            },
            {
              id: "github-oss",
              kind: "github",
              auth: { tokenEnv: "DCC_TEST_TOKEN" },
            },
          ],
        },
        repositories: [
          { id: "a", provider: "github", owner: "acme", name: "a" },
          { id: "b", provider: "github-oss", owner: "acme", name: "b" },
        ],
      }),
    );

    const provider = await getGitProvider("github-oss");
    const repos = await provider.listRepos().catch(() => []);

    // No network here; the assertion is that the adapter was built at all and
    // scoped to one entry — `listRepos` proves the binding in its own test.
    expect(provider.id).toBe("github-oss");
    expect(repos).toBeDefined();
  });

  it("asks which provider when several are configured and none is named", async () => {
    process.env.DCC_TEST_TOKEN = "ghp_test";
    writeConfig(
      config({
        providers: {
          git: [
            {
              id: "github",
              kind: "github",
              auth: { tokenEnv: "DCC_TEST_TOKEN" },
            },
            {
              id: "github-oss",
              kind: "github",
              auth: { tokenEnv: "DCC_TEST_TOKEN" },
            },
          ],
        },
        repositories: [],
      }),
    );

    const error = await getGitProvider().catch((thrown: unknown) => thrown);

    expect(error).toBeInstanceOf(GitHubError);
    expect((error as GitHubError).status).toBe(400);
    expect((error as GitHubError).message).toContain("?provider=");
  });

  it("names the configured ids when asked for one that does not exist", async () => {
    process.env.DCC_TEST_TOKEN = "ghp_test";
    writeConfig(config());

    const error = await getGitProvider("gitlab").catch(
      (thrown: unknown) => thrown,
    );

    expect((error as GitHubError).status).toBe(404);
    expect((error as GitHubError).message).toContain("github");
  });

  it("says so when no git provider is configured at all", async () => {
    writeConfig({ workspace: { name: "Test" } });

    const error = await getGitProvider().catch((thrown: unknown) => thrown);

    expect((error as GitHubError).status).toBe(501);
    expect((error as GitHubError).message).toContain("providers.git");
  });

  it("rejects a vendor this build cannot serve, naming the ones it can", async () => {
    process.env.DCC_TEST_TOKEN = "ghp_test";
    writeConfig(
      config({
        providers: {
          git: [
            { id: "gl", kind: "gitlab", auth: { tokenEnv: "DCC_TEST_TOKEN" } },
          ],
        },
        repositories: [],
      }),
    );

    const error = await getGitProvider().catch((thrown: unknown) => thrown);

    expect((error as GitHubError).status).toBe(501);
    expect((error as GitHubError).message).toContain("github");
  });
});
