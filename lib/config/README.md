# `lib/config`

The `dcc.config.json` schema (spec §4.1) — the **declared input** to DCC, and
the one place a hand-edited config file is validated.

## Declared input, not resolved output

This is deliberately not the `lib/domain` vocabulary, and the two must not be
unified. `lib/domain` holds the _resolved output_ of the inference resolver:
objects that carry a `uri`, a rolled-up `status`, and arrays of resolved URIs.
What an engineer writes here is _inference-first_ and _reference-by-id_ — a
service can be as small as `{ "id": "checkout" }`, and everything else is
derived by convention (§4.2). Every config field maps to a domain field, but the
shapes differ; widening one to match the other is the failure this codebase is
organized to prevent (see the root `CLAUDE.md`).

Consequences that hold throughout `schema.ts`:

- **References are id strings, never `Uri`.** Config is a reference graph keyed
  by id; URIs are minted later, at resolution.
- **Secrets are env-var _names_, never values (§10.2).** Every credential-bearing
  shape carries `tokenEnv`; no field anywhere accepts a raw token. `schema.test.ts`
  asserts this structurally against the generated JSON Schema.
- **Zod lives here** (and at route-handler boundaries), never in `lib/domain`:
  this is where untrusted external data actually enters the app.

## One definition, two artifacts

`dccConfigSchema` in `schema.ts` drives both runtime validation
(`dccConfigSchema.parse`) and editor autocomplete + inline validation. The
latter comes from `schema/dcc.schema.json`, which `json-schema.ts` generates and
the config references via `$schema`. **That file is generated, never
hand-edited** — regenerate it with:

```bash
pnpm gen:schema
```

`schema.test.ts` fails CI if the checked-in schema has drifted from the Zod
source, the way `format:check` guards formatting. Generation is emitted by Zod
4's native `z.toJSONSchema` rather than the `zod-to-json-schema` package §9
named — see [ADR-0003](../../docs/adr/adr-0003.md).

| File                          | Holds                                                                       |
| ----------------------------- | --------------------------------------------------------------------------- |
| `schema.ts`                   | `dccConfigSchema` + the per-section schemas; `DccConfig` and section types  |
| `json-schema.ts`              | `serializeJsonSchema` / `SCHEMA_PATH` — the import-safe generator half      |
| `reference-integrity.ts`      | `checkReferenceIntegrity` — dangling/duplicate-id validation (§4.1, #7)     |
| `load.ts`                     | `loadConfig` / `safeLoadConfig` — resolves `DCC_CONFIG`, reads, parses (#7) |
| `schema.test.ts`              | accept/reject cases, the no-secret-value guard, and the drift guard         |
| `reference-integrity.test.ts` | dangling-reference, duplicate-id, and did-you-mean cases                    |
| `load.test.ts`                | file resolution, missing/malformed-file, and pass-through error cases       |

The CLI wrapper is `scripts/generate-config-schema.mts`; the example config that
doubles as the autocomplete demo and the test fixture is `dcc.config.json` at
the repo root.

## Reference-integrity validation

`dccConfigSchema` validates each section's shape in isolation; a service
naming an unknown repository, or a dashboard pointing at a provider id that
doesn't exist, needs the whole config in hand to catch. That check —
`checkReferenceIntegrity` in `reference-integrity.ts` — is wired into
`dccConfigSchema` via `.superRefine()`, so `dccConfigSchema.parse`/`safeParse`
is still the one call site for both concerns. Dangling references are rejected
with a did-you-mean suggestion when a declared id is close enough to be the
obvious typo (the spec's own example: "service `checkout` references unknown
dashboard `errors` — did you mean `errors`?"); the same pass flags duplicate
ids within a collection, since the id-collection machinery needed for
dangling-reference checks makes that nearly free.

Provider references are checked against the matching category
(`repositories[].provider` against `providers.git`, not a flattened pool of
every provider id), so a repository accidentally pointing at an observability
provider is still caught.

## Loading the config

`load.ts` resolves the config path (an explicit override, then `DCC_CONFIG`,
then `./dcc.config.json`, per §4.1), reads and JSON-parses the file, and runs
it through `dccConfigSchema`. It mirrors the throw/`safe*` pair
`lib/domain/uri.ts` uses for `parseUri`/`safeParseUri`: `loadConfig` throws
`ConfigLoadError` on any failure (missing file, malformed JSON, invalid
config), and `safeLoadConfig` returns a `{ ok, value } | { ok, error }` result
instead — the one to reach for anywhere a bad config is a view to render
rather than an exception to catch.

## Not here (yet)

The config **repair screen** (§4.3) that renders these errors is a separate,
later issue (#8). The **file watcher** and hot-reload on external edits
(§4.3) is also later (#73) — `load.ts` reads the file once per call and does
not watch it.
