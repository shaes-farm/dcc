import { describe, expect, it } from "vitest";

import type { ProviderConfig } from "@/lib/config/schema";

import { resolveGitHubToken, tokenEnvName } from "./auth";
import { GitHubError } from "./errors";

const ghCli: ProviderConfig = { id: "github", kind: "github", auth: "gh-cli" };
const envAuth: ProviderConfig = {
  id: "github",
  kind: "github",
  auth: { tokenEnv: "GITHUB_TOKEN" },
};
const bareTokenEnv: ProviderConfig = {
  id: "github",
  kind: "github",
  tokenEnv: "GH_PAT",
};
const noCredential: ProviderConfig = { id: "github", kind: "github" };

/** `gh` is absent, wedged, or unauthenticated — all three look like this. */
const noGh = () => Promise.resolve(null);

describe("resolveGitHubToken (§6.1 auth resolution order)", () => {
  it("prefers `gh auth token` when auth is gh-cli", async () => {
    const credential = await resolveGitHubToken(ghCli, {
      readGhToken: () => Promise.resolve("gho_from_cli"),
      env: { GITHUB_TOKEN: "ghp_from_env" },
    });

    expect(credential).toEqual({ token: "gho_from_cli", source: "gh-cli" });
  });

  it("degrades to the token path when gh is missing, rather than failing", async () => {
    // The issue's bar: "a missing `gh` degrades to the token path rather than
    // failing". §4.1 forbids declaring `tokenEnv` alongside `auth`, so the
    // fallback is the pair `gh` itself reads before its keychain.
    const credential = await resolveGitHubToken(ghCli, {
      readGhToken: noGh,
      env: { GITHUB_TOKEN: "ghp_from_env" },
    });

    expect(credential).toEqual({
      token: "ghp_from_env",
      source: "env",
      tokenEnv: "GITHUB_TOKEN",
    });
  });

  it("prefers GH_TOKEN over GITHUB_TOKEN on that fallback, as gh does", async () => {
    const credential = await resolveGitHubToken(ghCli, {
      readGhToken: noGh,
      env: { GH_TOKEN: "ghp_gh", GITHUB_TOKEN: "ghp_github" },
    });

    expect(credential.token).toBe("ghp_gh");
  });

  it("reads the env var named by auth.tokenEnv", async () => {
    const credential = await resolveGitHubToken(envAuth, {
      readGhToken: noGh,
      env: { GITHUB_TOKEN: "ghp_from_env" },
    });

    expect(credential).toEqual({
      token: "ghp_from_env",
      source: "env",
      tokenEnv: "GITHUB_TOKEN",
    });
  });

  it("reads the bare top-level tokenEnv shape too (§4.1 accepts both)", async () => {
    const credential = await resolveGitHubToken(bareTokenEnv, {
      readGhToken: noGh,
      env: { GH_PAT: "ghp_bare" },
    });

    expect(credential).toEqual({
      token: "ghp_bare",
      source: "env",
      tokenEnv: "GH_PAT",
    });
  });

  it("trims whitespace and treats an empty env var as unset", async () => {
    await expect(
      resolveGitHubToken(envAuth, {
        readGhToken: noGh,
        env: { GITHUB_TOKEN: "   " },
      }),
    ).rejects.toThrow(GitHubError);
  });

  it("names both fixes when neither path produces a token", async () => {
    const provider: ProviderConfig = {
      id: "github",
      kind: "github",
      auth: { tokenEnv: "GITHUB_TOKEN" },
    };

    const error = await resolveGitHubToken(provider, {
      readGhToken: noGh,
      env: {},
    }).catch((thrown: unknown) => thrown);

    expect(error).toBeInstanceOf(GitHubError);
    expect((error as GitHubError).status).toBe(401);
    // Actionable, per §4.3: the message names the env var and the alternative.
    expect((error as GitHubError).message).toContain("GITHUB_TOKEN");
    expect((error as GitHubError).message).toContain("gh auth login");
  });

  it("names the gh fixes when gh-cli is declared and nothing answers", async () => {
    const error = await resolveGitHubToken(ghCli, {
      readGhToken: noGh,
      env: {},
    }).catch((thrown: unknown) => thrown);

    expect((error as GitHubError).message).toContain("gh auth login");
    expect((error as GitHubError).message).toContain("GITHUB_TOKEN");
  });

  it("says what to add when the provider declares no credential at all", async () => {
    const error = await resolveGitHubToken(noCredential, {
      readGhToken: noGh,
      env: {},
    }).catch((thrown: unknown) => thrown);

    expect((error as GitHubError).message).toContain("dcc.config.json");
    expect((error as GitHubError).message).toContain("gh-cli");
  });

  it("never puts the token in the error", async () => {
    const error = await resolveGitHubToken(envAuth, {
      readGhToken: () => Promise.resolve(null),
      env: { SOMETHING_ELSE: "ghp_secret_value" },
    }).catch((thrown: unknown) => thrown);

    expect(String(error)).not.toContain("ghp_secret_value");
  });
});

describe("tokenEnvName", () => {
  it("reads either §4.1 shape and nothing else", () => {
    expect(tokenEnvName(envAuth)).toBe("GITHUB_TOKEN");
    expect(tokenEnvName(bareTokenEnv)).toBe("GH_PAT");
    expect(tokenEnvName(ghCli)).toBeUndefined();
    expect(tokenEnvName(noCredential)).toBeUndefined();
  });
});
