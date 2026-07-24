import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { locateJsonPath, type TextPosition } from "./locate";
import { dccConfigSchema, type DccConfig } from "./schema";

/**
 * The config loader (spec §4.1, #7): resolves `dcc.config.json` (or
 * `DCC_CONFIG`), reads and parses it, and runs it through `dccConfigSchema` —
 * which now validates both shape and reference integrity (#7,
 * `reference-integrity.ts`) in one `parse`/`safeParse` call.
 *
 * Takes the same `{ ok, value } | { ok, error }` shape `lib/domain/uri.ts`
 * uses for `safeParseUri` (a hand-edited config file is exactly the kind of
 * external, untrusted input that shape exists for), but the composition is
 * the other way round: there, `parseUri` is the throwing primitive and
 * `safeParseUri` a thin wrapper around it; here `safeLoadConfig` holds all the
 * logic and `loadConfig` is the one that wraps *it*, throwing its error.
 * `safeLoadConfig` is the one to reach for anywhere a bad config is a view to
 * render (the repair screen, #8) rather than an exception to catch;
 * `loadConfig` is the convenience throw-through for callers that want to fail
 * fast instead.
 */

/** Default location of the config file, relative to `process.cwd()`. */
export const DEFAULT_CONFIG_PATH = "dcc.config.json";

/**
 * One validation problem, in Zod's own path shape (a mix of keys and
 * indices). `line`/`column` are 1-indexed and best-effort: present when
 * `locateJsonPath` (or, for malformed JSON, the engine's own `SyntaxError`
 * message) can place the problem in the raw text, absent when it can't
 * (a missing file, or a path that doesn't resolve against the text).
 */
export interface ConfigIssue {
  path: (string | number)[];
  message: string;
  line?: number;
  column?: number;
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

/**
 * The failure path carries only `error` — `error.configPath` already holds
 * the path, and duplicating it as a sibling `path` field would just be two
 * names for the same string with no rule keeping them in sync.
 */
export type ConfigLoadResult =
  | { ok: true; value: DccConfig; path: string }
  | { ok: false; error: ConfigLoadError };

/**
 * `override` takes precedence over `DCC_CONFIG`, which takes precedence over
 * the default. Empty strings from either are treated as unset with `||`
 * rather than `??`: a blank `DCC_CONFIG=""` (e.g. from a templated `.env`)
 * would otherwise resolve to `process.cwd()` itself — a directory, not a
 * file — and fail later with a confusing "illegal operation on a directory"
 * instead of falling back to the default path.
 */
function resolveConfigPath(override?: string): string {
  return resolve(
    process.cwd(),
    override || process.env.DCC_CONFIG || DEFAULT_CONFIG_PATH,
  );
}

function fail(path: string, message: string): ConfigLoadResult {
  return {
    ok: false,
    error: new ConfigLoadError(path, [{ path: [], message }]),
  };
}

/**
 * Best-effort `line`/`column` out of a `JSON.parse` `SyntaxError`'s own
 * message — modern V8 (verified on Node v24, the version this repo develops
 * against) already reports it there (e.g. "... in JSON at position 12 (line
 * 2 column 3)"). Not a language guarantee, so a message without that suffix
 * just yields `undefined` and the repair screen shows the message alone.
 */
function positionFromSyntaxError(message: string): TextPosition | undefined {
  const match = /line (\d+) column (\d+)/.exec(message);
  if (!match) return undefined;
  return { line: Number(match[1]), column: Number(match[2]) };
}

/**
 * Loads and validates the config, returning a result instead of throwing —
 * everything reaching this function came from a file on disk that the user
 * hand-edits, and a bad one is a view to render, not an exception to catch
 * (the same reasoning `parseDeepLink` documents in `lib/routing/deep-link.ts`).
 */
export function safeLoadConfig(override?: string): ConfigLoadResult {
  const path = resolveConfigPath(override);

  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch (error) {
    // A single read (no preceding `existsSync`) so there's one syscall, not a
    // stat-then-read race, and so a permissions error is distinguishable from
    // a missing file rather than both collapsing to "no config file at ...".
    const code = (error as NodeJS.ErrnoException).code;
    return code === "ENOENT"
      ? fail(path, `no config file at ${path}`)
      : fail(path, `could not read ${path}: ${(error as Error).message}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    const message = (error as Error).message;
    const position = positionFromSyntaxError(message);
    return {
      ok: false,
      error: new ConfigLoadError(path, [
        {
          path: [],
          message: `${path} is not valid JSON: ${message}`,
          ...position,
        },
      ]),
    };
  }

  const result = dccConfigSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => {
      const issuePath = issue.path as (string | number)[];
      const position = locateJsonPath(raw, issuePath);
      return { path: issuePath, message: issue.message, ...position };
    });
    return { ok: false, error: new ConfigLoadError(path, issues) };
  }

  return { ok: true, path, value: result.data };
}

/** Loads and validates the config, throwing `ConfigLoadError` if it is invalid. */
export function loadConfig(override?: string): DccConfig {
  const result = safeLoadConfig(override);
  if (!result.ok) throw result.error;
  return result.value;
}
