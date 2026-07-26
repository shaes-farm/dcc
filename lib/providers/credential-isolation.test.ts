import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

import * as providers from ".";

const ROOT = join(import.meta.dirname, "..", "..");

/** Recursive walk — `node:fs`'s `globSync` is newer than the repo's @types/node. */
function sourceFiles(dir: string, match: RegExp): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path, match);
    return match.test(entry.name) ? [path] : [];
  });
}

/**
 * Tokens never reach the browser bundle (§10.1, §10.2).
 *
 * "Grep `.next/static` after a build" is a check, and #11's acceptance criteria
 * include running it — but it only catches a leak after someone ships one.
 * These are the mechanisms that make the leak unreachable in the first place,
 * asserted so that undoing one fails CI rather than a code review:
 *
 *  1. The `lib/providers` barrel — which client components *do* import for
 *     types — exports no module that holds a resolved credential.
 *  2. `eslint.config.mjs` forbids the component tree and the app's pages from
 *     reaching past the barrel for one.
 */
describe("the provider barrel stays type-only and credential-free", () => {
  it("exports no GitHub implementation or registry symbol", () => {
    // `hasCapability` is the one intentional runtime export; everything else in
    // the barrel is an interface or a `const` vocabulary.
    const runtimeExports = Object.keys(providers);

    expect(runtimeExports).not.toContain("GitHubClient");
    expect(runtimeExports).not.toContain("GitHubGitProvider");
    expect(runtimeExports).not.toContain("getGitProvider");
    expect(runtimeExports).not.toContain("resolveGitHubToken");
  });

  it("does not re-export the github directory or the registry", () => {
    const barrel = readFileSync(join(ROOT, "lib/providers/index.ts"), "utf8");

    expect(barrel).not.toContain("./git/github");
    expect(barrel).not.toContain("./registry");
  });
});

describe("the lint boundary that closes the other direction", () => {
  it("restricts the token-bearing modules from components and app pages", () => {
    const config = readFileSync(join(ROOT, "eslint.config.mjs"), "utf8");

    expect(config).toContain("@/lib/providers/git/github/*");
    expect(config).toContain("@/lib/providers/registry");
    expect(config).toContain(
      'files: ["components/**/*.{ts,tsx}", "app/**/*.tsx"]',
    );
  });
});

describe("nothing in the client tree imports a credential-bearing module", () => {
  it("has no such import anywhere in the component tree or the app's pages", () => {
    const files = [
      ...sourceFiles(join(ROOT, "components"), /\.tsx?$/),
      // `app` also holds the route handlers, which are the intended callers;
      // only the `.tsx` under it ships to the browser.
      ...sourceFiles(join(ROOT, "app"), /\.tsx$/),
    ];

    // A belt-and-braces read of the same rule the linter enforces: if the lint
    // config is ever loosened, this still fails.
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      expect(
        source,
        `${relative(ROOT, file)} imports a server-only module`,
      ).not.toMatch(/from "@\/lib\/providers\/(git\/github|registry)/);
    }
  });
});
