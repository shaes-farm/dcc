# Developer Control Center (DCC) — Product & Technical Specification

**Version:** 0.1 (draft for redline)  
**Status:** Ready for Claude Design (UI) and Claude Code (implementation) handoff  
**Deployment model:** Local-only tool. Runs on the developer's machine, binds to localhost, uses the developer's own credentials. Single user, no server-side multi-tenancy.

---

## 1. Overview

DCC is a single-pane-of-glass control center for engineers working on cloud-native applications. It consolidates four surfaces that normally live in a dozen browser tabs — GitHub, Kubernetes/hosting dashboards, API documentation tools, and observability stacks — into one fast, dark, keyboard-driven local app.

It is **project-agnostic**: everything it shows is driven by a JSON config file (editable via a settings UI), so the same tool adapts to any project that follows similar conventions (GitHub for source, K8s/Vercel/Cloudflare for hosting, OpenAPI/GraphQL for APIs, OTel/Grafana-stack for observability).

### 1.1 Design principles

1. **Glanceable first, drill-down second.** Every screen answers "is anything broken?" in under 2 seconds before offering detail.
2. **Read-heavy, write-careful.** The app is primarily an inspection tool. A small set of *safe actions* (restart pod, re-run CI, trigger deploy) is allowed, always behind explicit confirmation, always audit-logged.
3. **Config as truth.** The JSON file is the source of truth. The settings UI is a friendly editor for that file, not a separate database.
4. **Bring your own credentials.** DCC never stores secrets. It uses credentials already on the machine (`gh` auth, kubeconfig, env vars).
5. **2am-proof UX.** Dark, minimal, high-contrast where it matters, no decorative noise, obvious status colors, forgiving of a tired brain.

### 1.2 Personas & primary scenarios

| Persona | Primary scenario |
|---|---|
| Software engineer | "Is my PR green? What did CodeQL flag? Let me poke the QA API for this endpoint." |
| DevOps / platform engineer | "Which pods are crash-looping in staging? Restart the bad one. Did the deploy go out?" |
| Tech lead | "Across our 9 repos, what security alerts are open? What's the error rate trend this week?" |
| On-call engineer (2am) | "Alert fired. Health-check everything, find the failing route, search logs, correlate with the last deploy." |

### 1.3 Non-goals (v1)

- Not a CI/CD system, IaC tool, or replacement for `kubectl`/Grafana power use.
- No multi-user auth, RBAC, or hosted deployment.
- No destructive/irreversible actions (delete namespace, force-push, merge PRs, scale to zero in prod-like envs).
- No alerting engine of its own (it *surfaces* alerts; it doesn't page you).
- No persistence of metrics/logs (always queried live from upstream; small local cache only).

---

## 2. System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Next.js app (localhost:7777)                                │
│                                                              │
│  React 19 UI (App Router, RSC where sensible)                │
│   ├─ Zustand: client/UI state (selections, panels, palette)  │
│   └─ TanStack Query: server-state cache (polling, retries)   │
│                                                              │
│  Route Handlers = local BFF / service layer                  │
│   ├─ /api/github/*     → GitHub REST+GraphQL (gh auth)       │
│   ├─ /api/deploy/*     → Provider adapters (K8s/Vercel/CF)   │
│   ├─ /api/apis/*       → Spec ingestion + request proxy      │
│   ├─ /api/obs/*        → Prometheus/Loki/Grafana/OTel/Vercel │
│   ├─ /api/config/*     → Read/validate/write JSON config     │
│   └─ /api/actions/*    → Safe-action executor + audit log    │
└──────────────────────────────────────────────────────────────┘
        │                │                  │
   GitHub API      kubeconfig ctxs     Grafana/Prom/Loki
   (token via      Vercel API          OTLP endpoints
   gh CLI/env)     Cloudflare API      Vercel analytics
```

**Why a BFF layer even locally:** browser CORS restrictions, credential isolation (tokens never reach the browser bundle), response normalization across providers, and a single choke point for the audit log and rate limiting.

### 2.1 Provider adapter pattern (key abstraction)

All hosting environments implement one interface so the UI is provider-agnostic:

```ts
interface DeploymentProvider {
  id: string;                       // "k8s", "vercel", "cloudflare"
  listEnvironments(): Promise<EnvSummary[]>;
  getEnvironment(id: string): Promise<EnvDetail>;      // workloads/pods/functions
  getWorkloadStatus(ref: WorkloadRef): Promise<WorkloadStatus>;
  getRecentDeploys(ref: EnvRef): Promise<Deploy[]>;
  getLogs(ref: WorkloadRef, opts: LogQuery): Promise<LogPage>;
  capabilities(): Capability[];     // e.g. "restartWorkload", "streamLogs"
  // Safe actions — only if capability is declared:
  restartWorkload?(ref: WorkloadRef): Promise<ActionResult>;
  triggerDeploy?(ref: EnvRef, opts?: DeployOpts): Promise<ActionResult>;
}
```

Normalized status vocabulary across providers: `healthy | degraded | failing | deploying | unknown`. K8s pods map from phase+restarts+readiness; Vercel maps from deployment state; Cloudflare from deployment/worker status. The UI only ever renders the normalized vocabulary.

### 2.2 Data freshness model

- **Polling via TanStack Query** with per-domain intervals (defaults): env status 15s, GitHub PRs/checks 60s, security alerts 5m, dashboards 30s, logs on demand.
- **Streaming** where cheap: `kubectl logs -f` equivalent via chunked responses/SSE from the route handler.
- Global "pause polling" toggle (battery/laptop mercy) and per-view manual refresh.
- Every panel shows a subtle "as of Xs ago" timestamp — critical for trust at 2am.

---

## 3. Configuration

### 3.1 The JSON file

Default path `./dcc.config.json` (overridable via `DCC_CONFIG` env var). JSON Schema published at `schema/dcc.schema.json` and referenced via `$schema` for editor autocomplete. **Secrets never live in this file** — fields that need credentials reference environment variable *names* (`tokenEnv`), resolved server-side at runtime from the shell/`.env.local`.

```jsonc
{
  "$schema": "./schema/dcc.schema.json",
  "workspace": { "name": "Acme Commerce", "defaultEnvironment": "dev" },

  "github": {
    "auth": "gh-cli",                    // "gh-cli" | { "tokenEnv": "GITHUB_TOKEN" }
    "repos": [
      { "owner": "acme", "name": "storefront", "tags": ["app", "nextjs"] },
      { "owner": "acme", "name": "checkout-svc", "tags": ["service"] },
      { "owner": "acme", "name": "ui-kit", "tags": ["library"] }
    ],
    "alerts": { "dependabot": true, "codeScanning": true, "secretScanning": true },
    "external": [                        // non-GitHub scanners surfaced read-only
      { "kind": "wiz", "reportUrl": "https://app.wiz.io/...", "tokenEnv": "WIZ_TOKEN" }
    ]
  },

  "environments": [
    {
      "id": "dev",
      "label": "Development",
      "provider": "kubernetes",
      "kubeContext": "acme-dev",
      "namespaces": ["storefront", "checkout"],
      "tier": "sandbox"                  // "sandbox" | "shared" | "prod-like"
    },
    { "id": "qa", "label": "QA", "provider": "kubernetes", "kubeContext": "acme-qa",
      "namespaces": ["storefront", "checkout"], "tier": "shared" },
    { "id": "preview", "label": "Vercel Previews", "provider": "vercel",
      "teamId": "team_x", "projectIds": ["prj_storefront"], "tokenEnv": "VERCEL_TOKEN",
      "tier": "sandbox" },
    { "id": "edge", "label": "CF Workers", "provider": "cloudflare",
      "accountId": "…", "workers": ["img-resizer"], "tokenEnv": "CF_API_TOKEN",
      "tier": "shared" }
  ],

  "services": [
    {
      "id": "checkout",
      "name": "Checkout Service",
      "repo": "acme/checkout-svc",
      "api": { "type": "openapi", "url": "https://qa.acme.dev/checkout/openapi.json" },
      "baseUrls": { "dev": "https://dev.acme.dev/checkout", "qa": "https://qa.acme.dev/checkout" },
      "auth": { "kind": "bearer", "tokenEnv": "CHECKOUT_QA_TOKEN" }
    },
    {
      "id": "catalog-graph",
      "name": "Catalog GraphQL",
      "api": { "type": "graphql", "url": "https://qa.acme.dev/graphql" },
      "baseUrls": { "qa": "https://qa.acme.dev/graphql" }
    }
  ],

  "observability": {
    "grafana": { "url": "https://grafana.acme.dev", "tokenEnv": "GRAFANA_TOKEN",
                 "pinnedDashboards": ["uid-errors", "uid-latency"] },
    "prometheus": { "url": "https://prom.acme.dev", "tokenEnv": "PROM_TOKEN" },
    "loki": { "url": "https://loki.acme.dev", "tokenEnv": "LOKI_TOKEN" },
    "tempo": { "url": "https://tempo.acme.dev", "tokenEnv": "TEMPO_TOKEN" },
    "vercelAnalytics": { "projectIds": ["prj_storefront"] },
    "healthChecks": [
      { "name": "Storefront", "url": "https://qa.acme.dev/healthz", "expectStatus": 200 },
      { "name": "Checkout", "url": "https://qa.acme.dev/checkout/healthz", "expectStatus": 200 }
    ]
  },

  "actions": {
    "enabled": true,
    "allow": ["restartWorkload", "rerunCi", "triggerDeploy"],
    "confirmPhraseForTiers": ["prod-like"]   // typed confirmation for risky tiers
  },

  "ui": { "pollingSeconds": { "environments": 15, "github": 60, "dashboards": 30 } }
}
```

### 3.2 Settings UI

- Full CRUD over every config section via forms (shadcn/ui), with Zod validation mirrored from the JSON Schema — one schema definition generates both.
- Writes back to the JSON file **preserving key order and comments are not supported** (file is plain JSON; the UI rewrites it deterministically). A diff preview is shown before save.
- "Test connection" button per integration (GitHub, each kube context, each observability endpoint, each API spec URL) with actionable error messages ("401 from Grafana — check GRAFANA_TOKEN in your shell").
- Invalid config never crashes the app: the app boots into a config-repair screen listing validation errors with line references.
- File watcher: external edits to `dcc.config.json` hot-reload the app state with a toast.

---

## 4. Module Specifications

### 4.1 Module: Repositories (GitHub)

**Purpose:** Manage and monitor the configured repos and their dependency libraries; surface security posture at a glance.

**Service layer:** GitHub REST + GraphQL v4. Auth resolution order: `gh auth token` (if `auth: "gh-cli"`), else `tokenEnv`. The `gh` CLI is an optional accelerator, not a hard dependency — everything must work with a plain token.

**Views:**

1. **Repo grid** — one card per repo: default-branch CI status, open PR count, open security-alert count (severity-weighted badge), last commit (author, relative time), tags. Sort/filter by tag, alert severity, staleness.
2. **Repo detail** — tabs:
   - *Pull requests:* list with check status, review state, mergeability, age; deep-link to GitHub. Safe action: **re-run failed checks** (workflow re-run).
   - *Branches & activity:* recent commits, active branches, releases/tags.
   - *Security:* unified alert table merging Dependabot, CodeQL/code-scanning, and secret-scanning, normalized to `{ source, severity, title, path?, firstSeen, url }`. External scanners (e.g., Wiz) appear as an additional source when configured; if the external API is unreachable, show a link-out card instead of failing the tab.
   - *Dependencies:* for repos tagged `library`, show reverse-dependency hints ("used by storefront, checkout-svc") derived from config tags + package manifests when detectable.
3. **Security rollup (workspace-level)** — all alerts across all repos in one severity-sorted table. This is the tech-lead landing page.

**Acceptance criteria:**
- With `gh` authenticated and 5 repos configured, the repo grid fully renders in < 3s on warm cache.
- Alert counts match GitHub UI within one polling interval.
- Re-run CI requires a confirmation dialog and appears in the audit log.

### 4.2 Module: Environments (K8s + normalized providers)

**Purpose:** Answer "what is running, where, and is it healthy?" across K8s, Vercel, and Cloudflare through one normalized UI.

**Service layer:** `@kubernetes/client-node` reading the local kubeconfig (contexts named in config); Vercel REST API; Cloudflare API. All behind the `DeploymentProvider` interface (§2.1).

**Views:**

1. **Environment overview** — one row/card per environment: normalized status rollup (worst-of), workload count, last deploy time + version/SHA, provider icon, tier badge (`sandbox`/`shared`/`prod-like`).
2. **Environment detail (K8s)** — namespaces → workloads (Deployments/StatefulSets/CronJobs) → pods. Per pod: phase, readiness, restart count (highlight > 3), age, image tag, resource requests vs usage if metrics-server is available. Crash-looping pods float to the top, always.
3. **Pod detail drawer** — recent events, container statuses, env-var *names* (values masked), live log tail (follow mode, pause, grep-style client filter). Safe actions: **restart workload** (rollout restart, not pod delete), **view manifest** (read-only YAML).
4. **Vercel/Cloudflare detail** — deployments list (state, branch, commit, duration, URL), function/worker status, links out. Safe action where supported: **trigger deploy / redeploy**.

**Normalization rules (must be documented in code):** e.g., K8s pod `CrashLoopBackOff` → `failing`; Vercel `ERROR` → `failing`; Vercel `BUILDING` → `deploying`; missing metrics → `unknown` (never guess `healthy`).

**Acceptance criteria:**
- Switching environments never blocks the UI; stale data remains visible with its timestamp while new data loads.
- Restart workload: confirmation dialog states env, tier, workload, and provider; `prod-like` tier additionally requires typing the workload name; action + result recorded in audit log.
- Kubeconfig context missing/unreachable degrades to an inline error card for that environment only.

### 4.3 Module: API Playground (OpenAPI / Swagger / GraphQL)

**Purpose:** Ingest API specs by URL and provide docs + examples + a request runner, so any engineer can learn and test an API without Postman.

**Service layer:**
- **Ingestion:** fetch spec URL server-side; detect and parse OpenAPI 3.x, Swagger 2.0 (auto-convert to OAS3 internally via `swagger2openapi`), or GraphQL (introspection query against the URL, or SDL if the URL returns SDL). Cache parsed spec locally; "refresh spec" button; show spec version + fetch time.
- **Request proxy:** all playground requests go through `/api/apis/proxy` so auth headers are injected server-side from `tokenEnv` and CORS is a non-issue. Per-service base URL selected by environment (from `baseUrls`).

**Views:**

1. **Service catalog** — configured services with API type badge, spec health (fetched OK / stale / failed), linked repo, available environments.
2. **REST explorer** — three-pane: operations tree (grouped by tag) → operation doc (params, request/response schemas rendered human-readably, auto-generated example payloads from schema defaults/examples) → request runner (method/URL prefilled, editable headers/query/body with JSON validation, environment picker, **Send**). Response pane: status, latency, headers, pretty/raw body toggle. History of last 50 requests per service (persisted locally), with "copy as curl".
3. **GraphQL explorer** — schema-aware editor (GraphiQL-style: autocomplete from introspected schema, docs sidebar, variables pane), same environment picker and history.

**Guardrails:** the proxy only sends requests to base URLs present in config (no arbitrary-URL relay). Mutating verbs (POST/PUT/PATCH/DELETE) against `prod-like`-tier base URLs show a warning banner before send.

**Acceptance criteria:**
- A Swagger 2.0 spec URL and an OAS 3.1 URL both render docs and runnable examples with zero config beyond the URL.
- GraphQL autocomplete works against any introspection-enabled endpoint.
- Auth token never appears in the browser (verify via devtools network tab — header injected by proxy only).

### 4.4 Module: Observability

**Purpose:** Quick health checks, error-rate and latency dashboards, and log search — the on-call landing zone.

**Service layer:** Prometheus HTTP API (instant + range queries), Loki HTTP API (LogQL), Grafana API (dashboard metadata + snapshot-render links + deep links), Tempo (trace lookup by ID), Vercel observability API where available. All optional — each configured backend lights up its features; missing backends hide theirs.

**Views:**

1. **Health board** — the default screen at 2am. Grid of configured health checks (HTTP probes run from the local BFF, showing status + latency + last change) plus per-environment status rollups from Module 2, plus top-line error rate sparkline per service. One glance = "what's on fire."
2. **Error rates** — per-service error-rate chart (Prometheus query templates, overridable per service in config), time-range picker (15m/1h/6h/24h/7d), deploy markers overlaid from Module 2's deploy history ("did the 14:32 deploy cause this?").
3. **Latency** — per-route p50/p95/p99 table + chart, sourced from OTel/Prometheus histograms; for Next.js-on-Vercel, route-level data from Vercel's API. Sortable by p95 to find the slow route fast.
4. **Log search** — LogQL-backed search with service/env/severity pickers compiled into label matchers, free-text filter, time range, live tail toggle. Log lines link to trace view when a `trace_id` is present (Tempo lookup). "Open in Grafana" deep link preserves the query.
5. **Pinned Grafana dashboards** — embedded via Grafana's shareable panels where auth allows; otherwise rendered link cards. Never block on Grafana being reachable.

**Acceptance criteria:**
- Health board renders meaningfully with *only* health-check URLs configured (no Prom/Loki required).
- Log search round-trip (query → first results) < 2s against a healthy Loki for a 1h window.
- Deploy markers appear on error-rate charts when Module 2 has deploy history for that service/env.

---

## 5. Cross-Cutting Features

### 5.1 Command palette (⌘K)
Global fuzzy palette: jump to any repo/environment/service/dashboard, run "safe actions" (with the same confirmations), toggle theme density, pause polling. Every navigable entity is indexed. This is the primary navigation for power users.

### 5.2 Safe-action framework
- Single executor at `/api/actions/*`; every action declares `{ id, provider, targetRef, tier, requiredConfirmation }`.
- Confirmation UX: standard dialog for `sandbox`/`shared`; typed-name confirmation for `prod-like`; all dialogs state exactly what will happen and against what.
- **Audit log:** append-only JSONL at `~/.dcc/audit.log` — `{ ts, action, target, env, result, durationMs }`. Viewable in-app (Settings → Audit).
- Kill switch: `actions.enabled: false` in config hides all action affordances app-wide.

### 5.3 Workspace status bar
Persistent bottom bar: active workspace name, polling status, aggregate alert count, clock, and a "system OK / N issues" beacon that mirrors the health board.

---

## 6. UX & Design Direction (for Claude Design)

- **Theme:** dark-only in v1. Near-black background (not pure #000), one accent color, restrained syntax-highlight palette for logs/JSON. Status colors are the only saturated colors on screen: green/amber/red/blue(deploying)/gray(unknown) — colorblind-safe pairs with icons, never color alone.
- **Density:** information-dense but calm. Tables over cards where data is comparable. Generous line-height in logs. Monospace (JetBrains Mono or similar) for identifiers, logs, JSON; a clean grotesque for UI chrome.
- **Layout:** left icon rail (Repos / Environments / APIs / Observability / Settings), content area, right-side drawers for detail (pod drawer, request history) so context is never lost. Status bar bottom.
- **Motion:** minimal; only state-change transitions (status color fades, drawer slides). No skeleton shimmer storms — prefer stale-data-with-timestamp over spinners.
- **Empty/error states:** every panel needs a designed empty state ("No repos configured → Add in Settings") and a degraded state (upstream unreachable) — these are first-class screens, not afterthoughts.
- **Screen inventory to design:** Health board, Repo grid, Repo detail (4 tabs), Security rollup, Environment overview, K8s environment detail, Pod drawer, Vercel/CF detail, Service catalog, REST explorer, GraphQL explorer, Log search, Error/latency dashboards, Settings (per-section forms + connection tests + config diff), Config-repair screen, Command palette, Audit log, all confirmation dialogs.

---

## 7. Tech Stack & Implementation Notes (for Claude Code)

| Concern | Choice |
|---|---|
| Framework | Next.js 15+ (App Router), React 19, TypeScript strict |
| Styling | Tailwind CSS v4 + shadcn/ui (Radix under the hood) |
| Client/UI state | Zustand (palette state, selections, drawer stack, polling toggle) |
| Server-state cache | TanStack Query (polling, retries, stale-while-revalidate) |
| Validation | Zod schemas, generated in tandem with JSON Schema (`zod-to-json-schema`) |
| K8s | `@kubernetes/client-node` |
| OpenAPI | `@readme/openapi-parser` or `@apidevtools/swagger-parser` + `swagger2openapi` |
| GraphQL | `graphql` + introspection; CodeMirror 6 for the editor |
| Charts | `recharts` (or lightweight `uPlot` for high-frequency series) |
| Logs streaming | SSE from route handlers |
| Config file I/O | Node `fs` in route handlers + `chokidar` watcher |

**Project conventions:** `src/lib/providers/*` for adapters, `src/lib/integrations/*` for GitHub/observability clients, `src/app/api/*` route handlers thin (validation + delegation), all upstream responses normalized at the integration layer before reaching the UI.

**Runtime:** `dcc dev` / `next start -p 7777`, bound to `127.0.0.1` only. No telemetry, no external calls except configured upstreams.

---

## 8. Security Model

1. **Localhost binding only** (`127.0.0.1`); refuse to start if configured otherwise without an explicit `--unsafe-host` flag.
2. **Secrets** only from environment variables / `gh` CLI / kubeconfig; never written to disk by DCC; never sent to the browser; masked in all UI (env-var names shown, values never).
3. **Request proxy allow-list:** playground and health checks can only call URLs derived from config.
4. **Least-privilege guidance** in docs: read-mostly GitHub token scopes; kube contexts can be read-only service accounts except where restart is wanted.
5. **Audit log** for every action (§5.2).
6. **No prod tier assumed:** environments default to `shared`; `prod-like` must be opted into per environment, which activates stricter confirmations.

---

## 9. Milestones (suggested Claude Code phasing)

| Phase | Scope | Exit criteria |
|---|---|---|
| **0. Skeleton** | App shell, config load/validate/repair screen, settings UI (read-only), theme, layout, palette shell | Boots with sample config; invalid config shows repair screen |
| **1. GitHub** | Repo grid, repo detail, security rollup, re-run CI action + audit log | §4.1 acceptance criteria pass |
| **2. Environments** | K8s provider, env overview/detail, pod drawer, log tail, restart action | §4.2 acceptance criteria pass (K8s only) |
| **3. API Playground** | OpenAPI/Swagger ingestion, REST explorer, proxy; then GraphQL | §4.3 acceptance criteria pass |
| **4. Observability** | Health board, error/latency views, Loki log search, deploy markers | §4.4 acceptance criteria pass |
| **5. Providers+** | Vercel + Cloudflare adapters, Vercel observability, trigger-deploy action | Normalized status verified across 3 providers |
| **6. Polish** | Settings full CRUD + connection tests + diff preview, audit viewer, empty/degraded states, keyboard map | Design QA against §6 |

---

## 10. Open Questions (flag during redline)

1. Should request history / playground bodies persist to disk (`~/.dcc/`) or stay in-memory per session? (Spec assumes disk, capped at 50/service.)
2. Wiz integration: API-level ingestion vs. link-out only in v1? (Spec assumes link-out with optional token-based summary.)
3. Do CronJobs/Jobs need first-class K8s views in v1, or Deployments/StatefulSets only?
4. Error-rate queries: ship opinionated default PromQL templates, or require per-service queries in config? (Spec assumes defaults + override.)
5. Any appetite for a read-only "share this view" static export (e.g., snapshot HTML) for pasting into incident channels?
