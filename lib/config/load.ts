import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { dccConfigSchema, type DccConfig } from "./schema";

/**
 * The config loader (spec §4.1, #7): resolves `dcc.config.json` (or
 * `DCC_CONFIG`), reads and parses it, and runs it through `dccConfigSchema` —
 * which now validates both shape and reference integrity (#7,
 * `reference-integrity.ts`) in one `parse`/`safeParse` call.
 *
 * Mirrors the throw/`safe*` pair `lib/domain/uri.ts` uses for `parseUri` and
 * `safeParseUri`: a hand-edited config file is exactly the kind of external,
 * untrusted input that convention exists for. `safeLoadConfig` is the one to
 * reach for anywhere a bad config is a view to render (the repair screen,
 * #8) rather than an exception to catch; `loadConfig` is the convenience
 * throw-through for callers that want to fail fast instead.
 */

/** Default location of the config file, relative to `process.cwd()`. */
export const DEFAULT_CONFIG_PATH = "dcc.config.json";

/** One validation problem, in Zod's own path shape (a mix of keys and indices). */
export interface ConfigIssue {
  path: (string | number)[];
  message: string;
}

/**
 * A config file that failed to load — missing, unreadable, malformed JSON, or
 * invalid per `dccConfigSchema` (which includes dangling/duplicate ids).
 * Carries every problem found, not just the first, the same way a repair
 * screen would want to list them all at once.
 */
export class ConfigLoadError extends Error {
  readonly configPath: string;
  readonly issues: ConfigIssue[];

  constructor(configPath: string, issues: ConfigIssue[]) {
    super(
      `Invalid config at ${configPath}: ${issues.map((issue) => issue.message).join("; ")}`,
    );
    this.name = "ConfigLoadError";
    this.configPath = configPath;
    this.issues = issues;
  }
}

export type ConfigLoadResult =
  | { ok: true; value: DccConfig; path: string }
  | { ok: false; error: ConfigLoadError; path: string };

/** `override` takes precedence over `DCC_CONFIG`, which takes precedence over the default. */
function resolveConfigPath(override?: string): string {
  return resolve(
    process.cwd(),
    override ?? process.env.DCC_CONFIG ?? DEFAULT_CONFIG_PATH,
  );
}

/**
 * Loads and validates the config, returning a result instead of throwing —
 * everything reaching this function came from a file on disk that the user
 * hand-edits, and a bad one is a view to render, not an exception to catch
 * (the same reasoning `parseDeepLink` documents in `lib/routing/deep-link.ts`).
 */
export function safeLoadConfig(override?: string): ConfigLoadResult {
  const path = resolveConfigPath(override);

  if (!existsSync(path)) {
    return {
      ok: false,
      path,
      error: new ConfigLoadError(path, [
        { path: [], message: `no config file at ${path}` },
      ]),
    };
  }

  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch (error) {
    return {
      ok: false,
      path,
      error: new ConfigLoadError(path, [
        {
          path: [],
          message: `could not read ${path}: ${(error as Error).message}`,
        },
      ]),
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    return {
      ok: false,
      path,
      error: new ConfigLoadError(path, [
        {
          path: [],
          message: `${path} is not valid JSON: ${(error as Error).message}`,
        },
      ]),
    };
  }

  const result = dccConfigSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => ({
      path: issue.path as (string | number)[],
      message: issue.message,
    }));
    return { ok: false, path, error: new ConfigLoadError(path, issues) };
  }

  return { ok: true, path, value: result.data };
}

/** Loads and validates the config, throwing `ConfigLoadError` if it is invalid. */
export function loadConfig(override?: string): DccConfig {
  const result = safeLoadConfig(override);
  if (!result.ok) throw result.error;
  return result.value;
}
