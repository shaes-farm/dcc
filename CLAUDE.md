# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

pnpm only (`packageManager: pnpm@11.11.0`).

```bash
pnpm dev            # 127.0.0.1:7777 via bin/dcc.mjs
pnpm build          # production build
pnpm check-types    # tsc --noEmit — the primary gate for type-only work
pnpm test           # vitest run
pnpm lint
pnpm format         # writes; run before format:check
pnpm format:check   # CI fails on unformatted files
```

Single test file or case:

```bash
pnpm vitest run lib/domain            # one directory
pnpm vitest run lib/domain/domain.test.ts
pnpm vitest run -t "status vocabulary"
```

CI (`.github/workflows/ci.yml`) runs lint → format:check → check-types → test → build, each independently of the others' failures, so one run surfaces every problem. Run all five locally before pushing.

## The spec is the source of truth

`docs/ARCHITECTURE.md` is the product and technical specification, frozen at v0.4, and it is the north star for every decision here. Work is issue-driven and each issue names its section — `gh issue view 2` opens with `**Spec:** §3.1`. **Read the cited section before implementing.** Section numbers are the shared vocabulary in code comments, commit messages, and PR bodies.

When the spec and an implementation convenience disagree, the spec wins, or the spec gets amended first. Concretely: §3.1 lists 23 canonical objects but §3.2 defines URI schemes for only 18, so `Issue`, `Release`, `Dependency`, `Provider`, and `HealthCheck` carry no `uri` rather than have local schemes invented for them. Widening the model to fit a provider is the failure mode this codebase is organized to prevent.

## Architecture

A local-only tool: one user, one machine, the developer's own credentials, bound to loopback. There is no multi-tenancy, no hosted deployment, and no server-side user model anywhere.

Data flows in one direction, and the layering is the whole point:

```text
lib/domain  →  lib/providers  →  lib/graph  →  app/api  →  app + components
```

- **`lib/domain`** — the §3 vocabulary. Every canonical object type plus the resource-URI codec. **Imports nothing else in the repo**, enforced by a `no-restricted-imports` block in `eslint.config.mjs`, not by discipline. See `lib/domain/README.md` for its internal conventions before adding a type.
- **`lib/providers`** — the plugin system (§2.2). Every integration category sits behind an interface; GitHub is merely the first `GitProvider`, not a feature. Two rules hold everywhere: **normalize upstream payloads into `lib/domain` types before they leave this layer**, and **declare capabilities** — the UI renders only what a provider declares, so no capability means no affordance.
- **`lib/graph`** — the Knowledge Graph (§3.3), in-memory adjacency over plain `Map`s. Every edge carries provenance (`declared | inferred | telemetry | knowledge`) so the UI can always answer "why do you think these two things are related?"
- **`app/api`** — thin route handlers. Validate, delegate, return. No upstream SDK calls, no normalization, no business logic. They exist on localhost for credential isolation, a single audit/allow-list choke point, and stable GET URLs that TanStack Query can poll.
- **`app` / `components`** — Zustand for client/UI state (`lib/stores/ui.ts`), TanStack Query for server state (`app/providers.tsx`). Server state never goes in Zustand.

Only `lib/domain` and the app shell are implemented so far; `lib/providers`, `lib/graph`, and `app/api` are README-only placeholders. Those READMEs state the intended contract — read the one for a directory before filling it in.

## Invariants that outlive any single issue

- **Everything is addressable.** Every rendered object carries its URI. Navigation history, favorites, layout presets, and graph edges store URIs and nothing else — never an ad-hoc object shape.
- **Reference the five scheme-less objects by `id`, not `Uri`.** `Issue`, `Release`, `Dependency`, `Provider`, and `HealthCheck` have no `uri` to point with, so a `Uri` field aimed at one is unrepresentable — it type-checks and can never hold a value. Watch for this in tests: `[]` satisfies any element type, so an empty fixture array hides exactly this mistake. Populate reference fields in fixtures.
- **One status vocabulary.** `healthy | degraded | failing | deploying | unknown` (§2.2), defined once in `lib/domain/common.ts`. Providers map onto it with the mapping documented in code (K8s `CrashLoopBackOff` → `failing`, Vercel `BUILDING` → `deploying`). Missing data is `unknown`; never guess `healthy`.
- **Timestamps are ISO-8601 strings**, never `Date` — these shapes cross the route-handler JSON boundary.
- **Closed unions ship as a `const` array plus a derived type** (`STATUSES` → `Status`), so the UI can iterate and tests can assert the set.
- **Zod belongs at boundaries**, not in the domain. Config (`dcc.config.json`) and route-handler input get schemas; the normalized output of providers does not.
- **Secrets are env-var _names_, never values.** Config carries `tokenEnv`; credentials resolve server-side and never reach the browser.
- **Config describes only what cannot be inferred** (§4.2). A service can be `{ "id": "checkout" }`; the resolver derives the rest by convention, and explicit config overrides inference field by field. Inference conflicts resolve to _no binding_ plus a warning, never a guess.
- **Read-heavy, write-careful.** Safe actions only, always confirmed, always audit-logged; `prod-like` tiers require typed-name confirmation. Nothing destructive or irreversible.

## Runtime posture (§10.1)

Every `package.json` server script routes through `bin/dcc.mjs` so the host guard cannot be bypassed out of habit: loopback-only binding unless `--unsafe-host` is passed explicitly, port 7777, Next telemetry disabled for the child process. Preserve that indirection — don't add scripts that call `next` directly.

## Vendored directories

`docs/ARCHITECTURE.md` and `docs/design/` are prettier-ignored, and `docs/design/` is eslint-ignored. The design system is an export owned by the kit that generated it; reformatting it makes the next re-export a needlessly large diff. Never run a formatter over them.
