/**
 * Emits the JSON Schema for `dccConfigSchema` (spec §4.1, #6). This is the pure,
 * import-safe half of schema generation; `scripts/generate-config-schema.mts` is
 * the thin CLI that writes the result to disk, and `schema.test.ts` imports the
 * same serializer to assert the checked-in file has not drifted.
 *
 * One Zod definition drives both runtime validation and this file; editors load
 * it via the config's `$schema` for autocomplete and inline validation.
 * ADR-0003 records why it is emitted by Zod 4's native `z.toJSONSchema` rather
 * than the `zod-to-json-schema` package §9 named.
 *
 * The output is run through Prettier with the repo's own config so the file is
 * format-clean without a hand-edit, and keys are sorted first so the bytes are
 * stable across runs and diff only on real schema changes.
 */

import { fileURLToPath } from "node:url";

import prettier from "prettier";
import { z } from "zod";

import { dccConfigSchema } from "./schema";

/** Absolute path of the checked-in schema — the generator writes here, the test reads it. */
export const SCHEMA_PATH = fileURLToPath(
  new URL("../../schema/dcc.schema.json", import.meta.url),
);

/** draft-07: the dialect VS Code's JSON language service supports most fully. */
export function buildJsonSchema(): unknown {
  return z.toJSONSchema(dccConfigSchema, { target: "draft-7" });
}

/** Recursively sort object keys so serialization is stable across runs. */
function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort()
        .map((key) => [key, sortKeys((value as Record<string, unknown>)[key])]),
    );
  }
  return value;
}

/** The exact bytes written to disk — reused by the drift test. */
export async function serializeJsonSchema(): Promise<string> {
  const json = JSON.stringify(sortKeys(buildJsonSchema()), null, 2);
  const options = await prettier.resolveConfig(SCHEMA_PATH);
  return prettier.format(json, {
    ...options,
    filepath: SCHEMA_PATH,
    parser: "json",
  });
}
