import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { ConfigLoadError, loadConfig, safeLoadConfig } from "./load";

const VALID_CONFIG = {
  workspace: { name: "Acme" },
  services: [{ id: "checkout" }],
};

const tempDirs: string[] = [];

function writeTempConfig(contents: string): string {
  const dir = mkdtempSync(join(tmpdir(), "dcc-config-test-"));
  tempDirs.push(dir);
  const path = join(dir, "dcc.config.json");
  writeFileSync(path, contents);
  return path;
}

function cleanupTempDirs(): void {
  while (tempDirs.length > 0) {
    rmSync(tempDirs.pop()!, { force: true, recursive: true });
  }
}

describe("safeLoadConfig", () => {
  afterEach(() => {
    delete process.env.DCC_CONFIG;
    cleanupTempDirs();
  });

  it("loads a valid config from an explicit path", () => {
    const tempPath = writeTempConfig(JSON.stringify(VALID_CONFIG));

    const result = safeLoadConfig(tempPath);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.workspace.name).toBe("Acme");
      expect(result.path).toBe(tempPath);
    }
  });

  it("falls back to DCC_CONFIG when no override is given", () => {
    const tempPath = writeTempConfig(JSON.stringify(VALID_CONFIG));
    process.env.DCC_CONFIG = tempPath;

    const result = safeLoadConfig();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.path).toBe(tempPath);
    }
  });

  it("returns an error result for a missing file", () => {
    const result = safeLoadConfig("/nonexistent/dcc.config.json");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(ConfigLoadError);
      expect(result.error.issues[0].message).toContain("no config file at");
    }
  });

  // Root ignores file permissions, so this would be a false pass in a
  // container running as root — skip there rather than assert nothing.
  const itUnlessRoot = process.getuid?.() === 0 ? it.skip : it;

  itUnlessRoot("distinguishes an unreadable file from a missing one", () => {
    const tempPath = writeTempConfig(JSON.stringify(VALID_CONFIG));
    chmodSync(tempPath, 0o000);

    try {
      const result = safeLoadConfig(tempPath);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.issues[0].message).toContain("could not read");
        expect(result.error.issues[0].message).not.toContain(
          "no config file at",
        );
      }
    } finally {
      chmodSync(tempPath, 0o644);
    }
  });

  it("treats an empty DCC_CONFIG as unset rather than resolving to cwd", () => {
    // A blank env var (e.g. from a templated .env) must not resolve to
    // process.cwd() itself — that's a directory, and reading it would fail
    // with a confusing "illegal operation on a directory" instead of falling
    // back to the default `dcc.config.json` path.
    const tempPath = writeTempConfig(JSON.stringify(VALID_CONFIG));
    const tempDir = tempPath.slice(0, tempPath.lastIndexOf("/"));
    const originalCwd = process.cwd();
    process.env.DCC_CONFIG = "";

    try {
      process.chdir(tempDir);
      const result = safeLoadConfig();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.path).toBe(tempPath);
      }
    } finally {
      process.chdir(originalCwd);
    }
  });

  it("returns an error result for malformed JSON", () => {
    const tempPath = writeTempConfig("{ not json");

    const result = safeLoadConfig(tempPath);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.issues[0].message).toContain("not valid JSON");
    }
  });

  it("returns an error result for a schema-shape violation", () => {
    const tempPath = writeTempConfig(
      JSON.stringify({ workspace: { name: "" } }),
    );

    const result = safeLoadConfig(tempPath);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });

  it("surfaces a dangling reference without throwing", () => {
    const tempPath = writeTempConfig(
      JSON.stringify({
        workspace: { name: "Acme" },
        services: [{ id: "checkout", repository: "unknown-repo" }],
      }),
    );

    const result = safeLoadConfig(tempPath);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      const issue = result.error.issues.find((candidate) =>
        candidate.message.includes("unknown repository"),
      );
      expect(issue?.message).toContain("`unknown-repo`");
    }
  });
});

describe("loadConfig", () => {
  afterEach(cleanupTempDirs);

  it("returns the parsed config on success", () => {
    const tempPath = writeTempConfig(JSON.stringify(VALID_CONFIG));

    expect(loadConfig(tempPath).workspace.name).toBe("Acme");
  });

  it("throws ConfigLoadError on failure", () => {
    expect(() => loadConfig("/nonexistent/dcc.config.json")).toThrow(
      ConfigLoadError,
    );
  });
});
