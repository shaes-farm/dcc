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
| `locate.ts`                   | `locateJsonPath` — issue path → line/column in the raw text (§4.3, #8)      |
| `schema.test.ts`              | accept/reject cases, the no-secret-value guard, and the drift guard         |
| `reference-integrity.test.ts` | dangling-reference, duplicate-id, and did-you-mean cases                    |
| `load.test.ts`                | file resolution, missing/malformed-file, and pass-through error cases       |
| `locate.test.ts`              | object keys, array indices, and not-found paths                             |

The CLI wrapper is `scripts/generate-config-schema.mts`; the example config that
doubles as the autocomplete demo and the test fixture is `dcc.config.json` at
the repo root.

## Reference-integrity validation

`dccConfigSchema` validates each section's shape in isolation; a service
naming an unknown repository, or an environment pointing at a provider id that
doesn't exist, needs the whole config in hand to catch. That check —
`checkReferenceIntegrity` in `reference-integrity.ts` — is wired into
`dccConfigSchema` via `.superRefine()`, so `dccConfigSchema.parse`/`safeParse`
is still the one call site for both concerns. It runs with `{ when: () =>
true }`, overriding Zod's default of skipping a `.superRefine()` once any
other issue exists anywhere in the config — without that, one unrelated typo
(a bad `environments[].tier`, say) would hide every dangling/duplicate-id
problem behind it. Because of that override, the check can't trust the config
actually matches `DccConfig` at runtime (a section that failed its own shape
check may hold whatever the author wrote), so it reads defensively rather than
assuming the type-level shape holds — see the doc comment on
`checkReferenceIntegrity` for how.

Every reference field is checked: `workspace.defaultEnvironment`,
`repositories[].provider`, `environments[].provider`,
`dashboards[].provider`, and `services[].repository`/`apis[]`/`dependsOn[]`/
`baseUrls` (keys, since it's a record keyed by environment id). Dangling
references are rejected with a did-you-mean suggestion when a declared id is
close enough to be the obvious typo, in the style of the spec's own
illustration ("service `checkout` references unknown dashboard `errors` — did
you mean `errors`?") — though that literal pairing isn't itself one of the
checks above, since `serviceConfig` has no `dashboards` field to be dangling
in (dashboards attach to a service by inference/naming, §4.2, never a declared
id list). The same pass flags duplicate ids within a collection, since the
id-collection machinery needed for dangling-reference checks makes that
nearly free.

Provider references are checked against the matching category
(`repositories[].provider` against `providers.git`, not a flattened pool of
every provider id), so a repository accidentally pointing at an observability
provider is still caught. Adding a new reference-shaped field to `schema.ts`
needs a matching check added here by hand — nothing structurally enforces the
link between "field declared as a reference" and "check exists for it."

## Loading the config

`load.ts` resolves the config path (an explicit override, then `DCC_CONFIG`,
then `./dcc.config.json`, per §4.1 — an empty string from either is treated as
unset, so it doesn't resolve to `process.cwd()` itself), reads and JSON-parses
the file, and runs it through `dccConfigSchema`. It returns the same `{ ok,
value } | { ok, error }` shape `lib/domain/uri.ts` uses for `safeParseUri` — a
hand-edited config file is exactly the kind of external, untrusted input where
a bad one is a view to render rather than an exception to catch — though the
composition runs the other way: `safeLoadConfig` holds all the logic, and
`loadConfig` is the convenience wrapper that throws
`ConfigLoadError` for callers that want to fail fast instead.

Each `ConfigIssue` also carries a best-effort `line`/`column`: schema and
reference-integrity issues run through `locate.ts`'s `locateJsonPath`, which
walks the raw JSON text for the offending `path`; a malformed-JSON issue
takes its position straight from the `SyntaxError` message instead, since
`locateJsonPath` needs already-valid JSON to walk. Either can come back
`undefined` — a missing file has no position to point at, and a path that
doesn't resolve against the text just omits the fields — so `line`/`column`
are optional on `ConfigIssue`, not guaranteed.

## Rendering the repair screen

`components/config/config-repair-screen.tsx` renders a `ConfigLoadError` —
the file path, and each issue's location (`line`/`column` above, when
present) and message (§4.3, #8). `app/layout.tsx` calls `safeLoadConfig()`
on every request (`export const dynamic = "force-dynamic"` — otherwise Next
could render the layout once at build time and never re-check) and renders
this screen in place of the app shell when it fails, so a broken
`dcc.config.json` degrades gracefully on every route, not just `/`.

## Not here (yet)

The **file watcher** and hot-reload on external edits (§4.3) is later (#73)
— `load.ts` reads the file once per call and does not watch it, so
recovering from the repair screen today means fixing the file and reloading
the page by hand.
