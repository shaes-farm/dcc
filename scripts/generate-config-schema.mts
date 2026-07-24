/**
 * Regenerates `schema/dcc.schema.json` from `dccConfigSchema` (spec §4.1, #6).
 *
 * A thin CLI over `lib/config/json-schema`: the schema is a build output, never
 * hand-edited. Run it with the alias loader so the bare-node invocation resolves
 * `@/…` (wired as `pnpm gen:schema`):
 *
 *   node --import ./scripts/alias-loader.mjs scripts/generate-config-schema.mts
 *
 * The schema test's drift guard fails CI if a commit forgets to regenerate.
 */

import { writeFileSync } from "node:fs";

import { SCHEMA_PATH, serializeJsonSchema } from "@/lib/config/json-schema";

writeFileSync(SCHEMA_PATH, await serializeJsonSchema());
console.log(`Wrote ${SCHEMA_PATH}`);
