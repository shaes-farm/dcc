/**
 * Regenerates `schema/dcc.schema.json` from `dccConfigSchema` (spec §4.1, #6).
 *
 * A thin CLI over `lib/config/json-schema`: the schema is a build output, never
 * hand-edited. Run via `pnpm gen:schema`, which uses `tsx` to resolve the `@/*`
 * tsconfig path alias and run this `.mts` file directly — `tsx` is a maintained
 * tool built for exactly this, so there is no bespoke module-resolution logic
 * to keep in sync with `tsconfig.json` by hand.
 *
 * The schema test's drift guard fails CI if a commit forgets to regenerate.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { SCHEMA_PATH, serializeJsonSchema } from "@/lib/config/json-schema";

mkdirSync(dirname(SCHEMA_PATH), { recursive: true });
writeFileSync(SCHEMA_PATH, await serializeJsonSchema());
console.log(`Wrote ${SCHEMA_PATH}`);
