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

| File             | Holds                                                                      |
| ---------------- | -------------------------------------------------------------------------- |
| `schema.ts`      | `dccConfigSchema` + the per-section schemas; `DccConfig` and section types |
| `json-schema.ts` | `serializeJsonSchema` / `SCHEMA_PATH` — the import-safe generator half     |
| `schema.test.ts` | accept/reject cases, the no-secret-value guard, and the drift guard        |

The CLI wrapper is `scripts/generate-config-schema.mts`; the example config that
doubles as the autocomplete demo and the test fixture is `dcc.config.json` at
the repo root.

## Not here (yet)

Reference-integrity validation — rejecting a `service` that names an unknown
`dashboard` (§4.1) — needs the whole config in hand and belongs with the config
loader and repair screen (§4.3). `dccConfigSchema` leaves a clean seam for it: a
future root-level `.superRefine((cfg, ctx) => …)` attaches without touching the
per-field shapes. Config loading (`DCC_CONFIG`, the `fs` read, the `chokidar`
watcher) is likewise a later issue.
