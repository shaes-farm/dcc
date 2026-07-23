# Developer Control Center (DCC) — Product & Technical Specification

**Version:** 0.4 (final pre-build amendment — frozen; build from here)
**Status:** Ready for Claude Design (UI) and Claude Code (implementation) handoff
**Deployment model:** Local-only tool. Runs on the developer's machine, binds to localhost, uses the developer's own credentials. Single user, no server-side multi-tenancy.
**Changelog 0.1 → 0.2:** Service is now the primary navigation object; formal Domain Model with resource URIs added (§3); all integrations generalized behind provider interfaces, not just deployments (§2.2); config restructured as a reference graph (§4); Workspace Health is the home screen (§5.1); UI recast as dockable panels with layout presets (§5.3); command palette promoted to a first-class spec (§5.4); Related Resources panel added (§5.5); cross-repo Git queries, API cross-linking, and observability correlation threads added (§6).
**Changelog 0.2 → 0.3:** The graph is elevated to the **Knowledge Graph** — the application's central data structure, modeling engineering knowledge, not just runtime (§3.3); **Document** added as a canonical object with `doc://` URIs (§3.1); `DocumentationProvider` generalized to **KnowledgeProvider**, with a minimal repo-markdown implementation in v1 (§2.2, §6.5); Related Resources renamed **Context** (§5.5); services become inference-first — config describes only what cannot be inferred (§4.2); product framing sharpened to *an IDE for distributed systems* (§1); Phase 0 refocused to domain model + provider interfaces + GitHub end-to-end + minimal cockpit (§11). Spec is now frozen; further sophistication should be earned in code.
**Changelog 0.3 → 0.4:** **Artifact** added as a canonical object — the bridge between source and runtime; deployments *consume* artifacts, repositories *produce* them (§3.1); **WorkflowRun** promoted from a Git-domain concept to a canonical object (§3.1); the Domain Model reframed around the **software delivery lifecycle** — Knowledge → Planning → Source → Build → Artifact → Deploy → Runtime → Observe — with providers enriching stages (§3.0); `ArtifactProvider` interface defined, with v1 lineage **derived** from existing data (workload image digests ↔ CI runs ↔ commit SHAs) and registry implementations deferred to Providers+ (§2.2, §11); **Lineage strip** added to the service cockpit (§5.2). Model now; providers later.

---

## 1. Overview

DCC is a single-pane-of-glass control center for engineers working on cloud-native applications. It consolidates the surfaces that normally live in a dozen browser tabs — GitHub, Kubernetes/hosting dashboards, API documentation tools, and observability stacks — into one fast, dark, keyboard-driven local app.

It is **project-agnostic**: everything it shows is driven by a JSON config file (editable via a settings UI), so the same tool adapts to any project that follows similar conventions (Git hosting for source, K8s/Vercel/Cloudflare for hosting, OpenAPI/GraphQL for APIs, OTel/Grafana-stack for observability).

Crucially, DCC is organized around the engineer's mental model, not the tools': you debug *Checkout*, you don't "look at Kubernetes." The **Service** is the primary object; tools are lenses onto it.

The mental model to build toward: **an IDE for distributed systems.** Where VS Code composes editor + filesystem + terminal + git + debugger around source code, DCC composes services + runtime + deployments + APIs + observability + knowledge around the *running system* — because in cloud-native work, the running system, not the source tree, is the primary artifact. This framing should guide product decisions: like an IDE, DCC is a stable shell (domain model, URIs, panels, palette, Knowledge Graph) into which providers plug capabilities.

### 1.1 Design principles

1. **The Service is the unit of thought.** Navigation, search, and layout organize around services (Checkout, Storefront, UI Library). Tool-centric views (all repos, all environments) remain as alternate lenses, not the spine.
2. **Glanceable first, drill-down second.** Every surface answers "is anything broken?" in under 2 seconds before offering detail. Workspace Health is the front door.
3. **Everything is addressable.** Every entity has a stable resource URI (§3.2). If you can see it, you can link to it, palette-jump to it, favorite it, and relate it to other things.
4. **Read-heavy, write-careful.** The app is primarily an inspection tool. A small set of *safe actions* (restart workload, re-run CI, trigger deploy) is allowed, always behind explicit confirmation, always audit-logged.
5. **Config describes only what cannot be inferred.** The JSON file is the source of truth for *identity and intent*; entities reference each other by ID and nothing is duplicated — but wherever a relationship can be derived (from manifests, labels, specs, telemetry), DCC infers it, and explicit config exists to override or fill gaps (§4.2). The settings UI is a friendly editor for that file, not a separate database.
6. **Bring your own credentials.** DCC never stores secrets. It uses credentials already on the machine (`gh` auth, kubeconfig, env vars).
7. **2am-proof UX.** Dark, minimal, high-contrast where it matters, no decorative noise, obvious status colors, forgiving of a tired brain.

### 1.2 Personas & primary scenarios

| Persona | Primary scenario | Typical layout preset |
|---|---|---|
| Software engineer | "Is my PR green? What did CodeQL flag? Let me poke the QA API for this endpoint." | Pods · Logs · API |
| DevOps / platform engineer | "Which pods are crash-looping in staging? Restart the bad one. Did the deploy go out?" | Environments · Deploys · Logs |
| Tech lead | "Across our 9 repos, what security alerts are open? What's the error rate trend this week?" | Security · PRs · Deploys · Metrics |
| On-call engineer (2am) | "Alert fired. Health-check everything, find the failing route, correlate with the last deploy." | Health · Metrics · Logs · Correlation |

### 1.3 Non-goals (v1)

- Not a CI/CD system, IaC tool, or replacement for `kubectl`/Grafana power use.
- No multi-user auth, RBAC, or hosted deployment.
- No destructive/irreversible actions (delete namespace, force-push, merge PRs, scale to zero in prod-like envs).
- No alerting engine of its own (it *surfaces* alerts; it doesn't page you).
- No persistence of metrics/logs (always queried live from upstream; small local cache only).
- Provider *interfaces* for issues are defined (§2.2) but no implementations ship in v1; knowledge ships only its minimal repo-markdown implementation (§6.5).

---

## 2. System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Next.js app (localhost:7777)                                │
│                                                              │
│  React 19 UI (App Router, RSC where sensible)                │
│   ├─ Panel/layout engine (dockable panels, presets)          │
│   ├─ URI resolver (resource URIs → panels)                   │
│   ├─ Zustand: client/UI state (layouts, palette, drawers)    │
│   └─ TanStack Query: server-state cache (polling, retries)   │
│                                                              │
│  Route Handlers = local BFF / service layer                  │
│   ├─ /api/git/*        → GitProvider impls (GitHub v1)       │
│   ├─ /api/deploy/*     → DeploymentProvider impls (K8s/…)    │
│   ├─ /api/apis/*       → ApiProvider: spec ingest + proxy    │
│   ├─ /api/obs/*        → ObservabilityProvider impls         │
│   ├─ /api/graph/*      → Knowledge graph queries          │
│   ├─ /api/config/*     → Read/validate/write JSON config     │
│   └─ /api/actions/*    → Safe-action executor + audit log    │
└──────────────────────────────────────────────────────────────┘
        │                │                  │
   GitHub API      kubeconfig ctxs     Grafana/Prom/Loki
   (token via      Vercel API          OTLP endpoints
   gh CLI/env)     Cloudflare API      Vercel analytics
```

**Why a BFF layer even locally:** browser CORS restrictions, credential isolation (tokens never reach the browser bundle), response normalization across providers, and a single choke point for the audit log and rate limiting.

**Why route handlers rather than React Server Functions:** Server Functions are designed for component-invoked mutations — they're POST-only, compiled to opaque endpoints, and coupled to the React render tree. This app's service layer is dominated by *reads* that want the opposite properties: stable, addressable GET endpoints that TanStack Query can poll, dedupe, and cache by URL; SSE/chunked responses for log streaming (not possible from a Server Function); and an explicit HTTP surface you can hit with `curl` when debugging DCC itself at 2am. Route handlers also keep the choke-point story honest — one middleware layer for audit logging and the proxy allow-list, rather than logic scattered across action functions. Server Functions remain fair game as an implementation detail for simple form mutations in the Settings UI, but the service layer contract is route handlers.

### 2.1 Data freshness model

- **Polling via TanStack Query** with per-domain intervals (defaults): env status 15s, Git PRs/checks 60s, security alerts 5m, dashboards 30s, logs on demand.
- **Streaming** where cheap: `kubectl logs -f` equivalent via chunked responses/SSE from the route handler.
- Global "pause polling" toggle (battery/laptop mercy) and per-panel manual refresh.
- Every panel shows a subtle "as of Xs ago" timestamp — critical for trust at 2am.

### 2.2 Provider interfaces (the plugin system)

Every integration category — not just deployments — sits behind a provider interface. GitHub is merely the v1 `GitProvider` implementation; GitLab or Azure DevOps become alternate implementations, not new features. Same for Nomad/Fly/Railway behind `DeploymentProvider`, or Datadog behind `ObservabilityProvider`. Providers self-describe via `capabilities()`, and the UI renders only what a provider declares — no capability, no affordance.

```ts
interface Provider {
  id: string;                                  // "github", "k8s", "vercel", "loki", …
  kind: "git" | "deployment" | "observability" | "api" | "issue" | "knowledge" | "artifact";
  capabilities(): Capability[];
  testConnection(): Promise<ConnectionResult>; // powers Settings "test" buttons
}

interface GitProvider extends Provider {
  listRepos(): Promise<Repository[]>;
  listPullRequests(repo: Uri, filter?: PrFilter): Promise<PullRequest[]>;
  listWorkflowRuns(scope: Uri | "workspace", filter?: RunFilter): Promise<WorkflowRun[]>;
  listAlerts(scope: Uri | "workspace"): Promise<SecurityAlert[]>;   // normalized, all sources
  listReleases(repo: Uri): Promise<Release[]>;
  listIssues?(repo: Uri): Promise<Issue[]>;
  rerunWorkflow?(run: Uri): Promise<ActionResult>;                  // safe action
}

interface DeploymentProvider extends Provider {
  listEnvironments(): Promise<EnvSummary[]>;
  getEnvironment(env: Uri): Promise<EnvDetail>;          // workloads/pods/functions
  getWorkloadStatus(w: Uri): Promise<WorkloadStatus>;
  getRecentDeploys(env: Uri): Promise<Deploy[]>;
  getLogs(w: Uri, opts: LogQuery): Promise<LogPage>;
  restartWorkload?(w: Uri): Promise<ActionResult>;       // safe action
  triggerDeploy?(env: Uri, opts?: DeployOpts): Promise<ActionResult>;
}

interface ObservabilityProvider extends Provider {
  queryMetrics?(q: MetricQuery): Promise<Series[]>;      // Prometheus, Vercel
  searchLogs?(q: LogSearch): Promise<LogPage>;           // Loki
  getTrace?(traceId: string): Promise<Trace>;            // Tempo
  listDashboards?(): Promise<DashboardRef[]>;            // Grafana
}

interface ApiProvider extends Provider {
  fetchSpec(source: SpecSource): Promise<NormalizedSpec>; // OAS3 | Swagger2→OAS3 | GraphQL introspection
  proxyRequest(req: PlaygroundRequest): Promise<PlaygroundResponse>;
}

interface ArtifactProvider extends Provider {
  listArtifacts(scope: Uri | "workspace"): Promise<ArtifactRef[]>;   // per repo/service or all
  getArtifact(a: Uri): Promise<Artifact>;         // versions, tags, digest, publishedAt, provenance
  resolveByDigest(digest: string): Promise<Artifact | null>;         // link runtime → registry
}

interface KnowledgeProvider extends Provider {
  listDocuments(scope: Uri | "workspace"): Promise<DocumentRef[]>;  // ADRs, RFCs, runbooks, READMEs…
  getDocument(doc: Uri): Promise<Document>;                         // normalized: title, kind, body (md), source
}

// Defined for future-proofing; no v1 implementations:
interface IssueProvider extends Provider { /* Jira, Linear, GitHub Issues-as-tracker */ }
```

`KnowledgeProvider` deliberately generalizes "documentation": repo markdown, GitHub wikis, Notion, Confluence, Obsidian vaults, and Google Docs are all just knowledge sources that emit `Document`s into the Knowledge Graph. **v1 ships one trivial implementation** — *repo-markdown*, which discovers `README*`, `docs/**`, and `adr|adrs|rfcs/**` through the Git provider (§6.5) — so `doc://` URIs and the Context panel have real content from day one. Richer sources plug in later without touching the UI.

`ArtifactProvider` covers package/container registries — GHCR, GitHub Packages, Docker Hub, ECR/ACR/GAR, Artifactory, Harbor, Nexus, npm, NuGet — which all expose the same concepts: versions, tags, digests, publication dates, provenance. **No registry implementation is required for v1 lineage:** Artifact nodes are *derived* from data DCC already fetches — the image reference/digest on a running workload, matched by SHA/tag to the CI run and commit that produced it. Registry providers (GHCR/GitHub Packages first, riding existing GitHub auth) later enrich those same nodes with version history, publish metadata, and provenance attestations (SBOM/SLSA attach here too) without any model change.

**Normalized status vocabulary** across all deployment providers: `healthy | degraded | failing | deploying | unknown`. Mapping rules must be documented in code (e.g., K8s `CrashLoopBackOff` → `failing`; Vercel `BUILDING` → `deploying`; missing metrics → `unknown`, never guess `healthy`). The UI only ever renders the normalized vocabulary.

---

## 3. Domain Model, Addressability & the Knowledge Graph

This section defines the canonical objects and the graph that connects them. Every panel, provider, and config entity builds on this vocabulary — new providers map *into* it, preventing drift as the platform grows.

### 3.0 Organizing principle: the software delivery lifecycle

The canonical objects are not a pile of resources — they are **stages in the software delivery lifecycle**, and every provider enriches one or more stages:

```
Knowledge → Planning → Source  →  Build   → Artifact →  Deploy   → Runtime  → Observe
(Document)  (Issue*)  (Repository, (WorkflowRun) (Artifact) (Deployment) (Workload,  (Dashboard,
                       PullRequest)                                        Pod, Api)  Logs, Trace)
                                                                    * interface only in v1
```

This is a stronger organizing principle than "GitHub + Kubernetes + Grafana": new capabilities — artifact registries today; SBOMs, SLSA provenance attestations, vulnerability scanners tomorrow — attach to existing lifecycle nodes (mostly `Artifact`) and participate in the same Knowledge Graph without changing the model. A deployment doesn't produce a container; it **consumes** one. A repository doesn't deploy; it **produces** artifacts via workflows. The model reflects that reality.

### 3.1 Canonical objects

| Object | Definition | Produced by |
|---|---|---|
| **Workspace** | The root: one config file, one set of services/providers. | Config |
| **Service** | The primary object. A logical application/component an engineer thinks in (Checkout, UI Library). Aggregates references to everything below. | Config |
| **Repository** | A source repo (code, library, infra). | GitProvider |
| **PullRequest / Issue / Release / SecurityAlert / Dependency** | Normalized Git-domain concepts, each independently queryable across all repos. | GitProvider |
| **WorkflowRun** | A CI/build execution (GitHub Actions in v1; CircleCI, Jenkins, Buildkite, GitLab CI later). The Build stage: consumes a commit, produces artifacts. Answers "which workflow produced this image?" and "which workflow failed?" | GitProvider (CI providers later) |
| **Artifact** | A published, versioned build output: OCI/Docker image, npm/NuGet/Maven/PyPI package, Helm chart, Debian package, Terraform module. Fields: `id, version, tags, digest, publishedAt, publisher, sourceRepo, sourceCommit, producingRun, provenance?`. The bridge between engineering and operations: repositories produce artifacts, deployments consume them. | Derived (v1) + ArtifactProvider |
| **Environment** | A deployment target (dev, qa, staging, previews) with a `tier` (`sandbox`/`shared`/`prod-like`). | Config + DeploymentProvider |
| **Deployment** | A rollout event of a service into an environment (version/SHA, time, actor, state). | DeploymentProvider |
| **Workload** | A running unit (K8s Deployment/StatefulSet/CronJob, Vercel function, CF worker). Contains **Pods** where applicable. | DeploymentProvider |
| **Api** | An ingested spec (REST or GraphQL) with **Operations**. | ApiProvider |
| **Dashboard** | A metrics view (pinned Grafana dashboard or built-in error/latency view). | ObservabilityProvider |
| **HealthCheck** | An HTTP probe with expected status. | Config + BFF |
| **LogStream / Trace** | Queryable log scope; a distributed trace. | ObservabilityProvider |
| **Document** | A unit of engineering knowledge with a `kind`: ADR, RFC, runbook, incident, playbook, README, design doc, architecture note. Not "documentation" as a feature — a first-class node linkable to anything. | KnowledgeProvider |
| **Action** | A safe, auditable operation against a target URI. | Action framework |
| **Provider** | A configured integration instance. | Config |

### 3.2 Resource URIs

Every instance of every object has a stable URI:

```
workspace://commerce
service://checkout
repo://github/acme/checkout-svc
pr://github/acme/checkout-svc/482
run://github/acme/checkout-svc/9182734
artifact://ghcr/acme/checkout@sha256:4bf9…      artifact://npm/@acme/ui-kit@3.7.12
alert://github/codeql/1234
env://qa
deploy://qa/checkout/2026-07-21T14.32_a1b2c3d
workload://qa/checkout/deployment/checkout
pod://qa/checkout/checkout-6df4cbf8b
api://checkout/rest          op://checkout/rest/createOrder
dashboard://grafana/uid-errors
doc://repo-md/checkout-svc/docs/adr/0017-extract-pricing.md
doc://repo-md/checkout-svc/runbooks/checkout-oncall.md
logs://loki?service=checkout&env=qa
trace://tempo/4bf92f35
action://restartWorkload?target=workload://qa/checkout/deployment/checkout
```

**Rules:**
- Anything rendered anywhere carries its URI: right-click/⌘-click → **Copy link**; pasting a URI into the palette navigates to it.
- The internal router resolves `URI → panel + parameters`; browser deep links mirror URIs (`/r/service%3A%2F%2Fcheckout`).
- Navigation history, favorites, layout presets, and the Knowledge Graph all store URIs — nothing stores ad-hoc object shapes.
- URIs make future plugins trivial: a plugin contributes URI schemes + panels, and palette/linking/relationships work automatically.

### 3.3 The Knowledge Graph

**The Knowledge Graph is the application.** It is DCC's central data structure — a typed graph of edges between URIs modeling *engineering knowledge*, not just runtime state: what runs where, but also what documents explain it, what decisions shaped it, what depends on it, and who owns it. Providers exist to enrich the graph; panels exist to render slices of it; the palette, Context panel, correlation threads, and dependency map are all just queries against it. Rebuilt on config load, enriched continuously at runtime.

| Edge source | Examples |
|---|---|
| **Declared** (config references, §4) | `service://checkout —has-repo→ repo://…`, `—runs-in→ env://qa`, `—exposes→ api://checkout/rest`, `—measured-by→ dashboard://…` |
| **Inferred from providers** | the supply chain: `repo —via PR/merge→ commit —built-by→ run —produced→ artifact —consumed-by→ deployment —runs-as→ workload` (SHA/digest/tag matching); pods ↔ workloads ↔ services (label/selector match); alerts ↔ repos ↔ services; repo manifests → services (§4.2) |
| **Inferred from telemetry/specs** | service → service call edges from OTel service-graph metrics or OpenAPI `links`; manual `dependsOn` config edges as fallback |
| **Knowledge** | `service://checkout —explained-by→ doc://…adr/0017…`, `—runbook→ doc://…checkout-oncall…`, `—owned-by→ CODEOWNERS entry`; doc→doc links from markdown cross-references |

Every edge carries provenance (`declared | inferred | telemetry | knowledge`) and, for inferred edges, its evidence. `/api/graph/related?uri=…` returns typed edges; `/api/graph/path?from=…&to=…` supports correlation threads.

---

## 4. Configuration

### 4.1 The JSON file — a reference graph

Default path `./dcc.config.json` (overridable via `DCC_CONFIG` env var). JSON Schema published at `schema/dcc.schema.json` and referenced via `$schema` for editor autocomplete. **Secrets never live in this file** — fields needing credentials reference environment variable *names* (`tokenEnv`), resolved server-side at runtime.

The config is shaped as **keyed collections + ID references**: every entity is declared once with an `id`, and services (and anything else) reference those IDs. Nothing duplicates information; validation rejects dangling references with a precise error ("service `checkout` references unknown dashboard `error`s — did you mean `errors`?").

```jsonc
{
  "$schema": "./schema/dcc.schema.json",
  "workspace": { "name": "Acme Commerce", "defaultEnvironment": "dev" },

  "providers": {
    "git": [{ "id": "github", "kind": "github", "auth": "gh-cli" }],   // or { "tokenEnv": "GITHUB_TOKEN" }
    "deployment": [
      { "id": "k8s-dev", "kind": "kubernetes", "kubeContext": "acme-dev" },
      { "id": "k8s-qa",  "kind": "kubernetes", "kubeContext": "acme-qa" },
      { "id": "vercel",  "kind": "vercel", "teamId": "team_x", "tokenEnv": "VERCEL_TOKEN" },
      { "id": "cf",      "kind": "cloudflare", "accountId": "…", "tokenEnv": "CF_API_TOKEN" }
    ],
    "observability": [
      { "id": "grafana", "kind": "grafana", "url": "https://grafana.acme.dev", "tokenEnv": "GRAFANA_TOKEN" },
      { "id": "prom",    "kind": "prometheus", "url": "https://prom.acme.dev", "tokenEnv": "PROM_TOKEN" },
      { "id": "loki",    "kind": "loki", "url": "https://loki.acme.dev", "tokenEnv": "LOKI_TOKEN" },
      { "id": "tempo",   "kind": "tempo", "url": "https://tempo.acme.dev", "tokenEnv": "TEMPO_TOKEN" }
    ],
    "external": [
      { "id": "wiz", "kind": "wiz", "reportUrl": "https://app.wiz.io/…", "tokenEnv": "WIZ_TOKEN" }
    ]
  },

  "repositories": [
    { "id": "storefront",   "provider": "github", "owner": "acme", "name": "storefront",   "tags": ["app", "nextjs"] },
    { "id": "checkout-svc", "provider": "github", "owner": "acme", "name": "checkout-svc", "tags": ["service"] },
    { "id": "ui-kit",       "provider": "github", "owner": "acme", "name": "ui-kit",       "tags": ["library"] }
  ],

  "environments": [
    { "id": "dev", "label": "Development", "provider": "k8s-dev", "namespaces": ["storefront", "checkout"], "tier": "sandbox" },
    { "id": "qa",  "label": "QA",          "provider": "k8s-qa",  "namespaces": ["storefront", "checkout"], "tier": "shared" },
    { "id": "preview", "label": "Vercel Previews", "provider": "vercel", "projectIds": ["prj_storefront"], "tier": "sandbox" },
    { "id": "edge", "label": "CF Workers", "provider": "cf", "workers": ["img-resizer"], "tier": "shared" }
  ],

  "apis": [
    { "id": "checkout-rest",  "type": "openapi", "url": "https://qa.acme.dev/checkout/openapi.json",
      "auth": { "kind": "bearer", "tokenEnv": "CHECKOUT_QA_TOKEN" } },
    { "id": "catalog-graph",  "type": "graphql", "url": "https://qa.acme.dev/graphql" }
  ],

  "dashboards": [
    { "id": "errors",  "provider": "grafana", "uid": "uid-errors" },
    { "id": "latency", "provider": "grafana", "uid": "uid-latency" }
  ],

  "healthChecks": [
    { "id": "hc-storefront", "name": "Storefront", "url": "https://qa.acme.dev/healthz", "expectStatus": 200 },
    { "id": "hc-checkout",   "name": "Checkout",   "url": "https://qa.acme.dev/checkout/healthz", "expectStatus": 200 }
  ],

  "services": [
    { "id": "storefront" },                       // inference-first: everything below is derived (§4.2)
    { "id": "ui-kit" },                           // libraries are services too
    { "id": "catalog", "apis": ["catalog-graph"] },
    {
      "id": "checkout",                           // every field below is an *override* of inference (§4.2)
      "name": "Checkout Service",
      "repository": "checkout-svc",               // needed: repo id ≠ service id
      "workloadSelector": { "namespace": "checkout", "labels": { "app": "checkout" } },
      "baseUrls": { "dev": "https://dev.acme.dev/checkout", "qa": "https://qa.acme.dev/checkout" },
      "dependsOn": ["catalog"]                    // manual edge; OTel-derived edges merge in
    }
  ],

  "actions": {
    "enabled": true,
    "allow": ["restartWorkload", "rerunCi", "triggerDeploy"],
    "confirmPhraseForTiers": ["prod-like"]
  },

  "ui": { "pollingSeconds": { "environments": 15, "git": 60, "dashboards": 30 } }
}
```

### 4.2 Inference-first services

**Configuration describes only what cannot be inferred.** A service can be as small as `{ "id": "checkout" }`; DCC's **resolver** derives the rest by walking conventions, in a documented order, at config load (and refreshes as providers report):

| Step | Inference | From |
|---|---|---|
| 1 | Repository | `repositories[]` entry whose `id` or `name` matches the service id |
| 2 | APIs | Spec discovery: OpenAPI/GraphQL endpoints advertised in the repo (well-known paths, `package.json`/manifest hints) or `apis[]` entries whose id is prefixed by the service id |
| 3 | Environments & workloads | Workloads across configured environments whose labels/name match the service id (K8s label conventions: `app`, `app.kubernetes.io/name`) |
| 4 | Deployments & base URLs | From matched workloads' provider metadata (ingress/route where derivable) |
| 4b | Artifacts & producing runs | From matched workloads' image references (digest/tag) ↔ workflow runs and commits by SHA/tag match; registry metadata merged in when an `ArtifactProvider` is configured |
| 5 | Dashboards & health checks | `dashboards[]` / `healthChecks[]` entries tagged with or named after the service |
| 6 | Documents & owners | Repo-markdown discovery (README, docs/**, ADRs, runbooks) + `CODEOWNERS` |
| 7 | Dependencies | OTel service-graph → OpenAPI `links` → manual `dependsOn` |

**Rules:**
- **Explicit config always overrides inference** — field-level, not object-level (declaring `repository` doesn't disable workload inference).
- Every inferred binding is an edge in the Knowledge Graph with provenance and evidence, so nothing is magic.
- **Resolved-config inspector** (Settings → Resolution): shows, per service, every binding with its source — `repository: checkout-svc (inferred: name match)` / `baseUrl.qa: … (declared)` — plus unmatched entities ("workload `payments` in qa matched no service"). This is mandatory: inference without inspection is a 2am trap.
- Inference conflicts (two candidate matches) resolve to *no binding* + a resolution warning, never a guess.

### 4.3 Settings UI

- Full CRUD over every config section via forms (shadcn/ui), with Zod validation mirrored from the JSON Schema — one schema definition generates both. Reference fields render as pickers over existing IDs (no free-text foreign keys).
- Writes back to the JSON file deterministically (stable key order; plain JSON, no comments). A diff preview is shown before save.
- "Test connection" button per provider (via `Provider.testConnection()`) with actionable error messages ("401 from Grafana — check GRAFANA_TOKEN in your shell").
- Invalid config never crashes the app: the app boots into a config-repair screen listing validation errors (including dangling references) with line references.
- File watcher: external edits to `dcc.config.json` hot-reload the app state with a toast.

---

## 5. Navigation & Layout Model

### 5.1 Workspace Health — the home screen (Mission Control)

The app opens onto a workspace-wide rollup, not a tool:

```
Acme Commerce                                    ● 5 issues
─────────────────────────────────────────────────────────────
 18 services · 3 unhealthy      23 repositories · 4 red CI
 147 pods · 98% healthy         11 security alerts (2 critical)
 2 deploys running              6/6 health checks passing
─────────────────────────────────────────────────────────────
 Attention needed:
 ⛔ checkout · qa    CrashLoopBackOff (restarts: 7)     → open
 ⚠ storefront       p95 latency +240% since deploy 14:32 → open
 ⚠ ui-kit           CodeQL critical: prototype pollution → open
```

Every number and row is a drill-down (it's a URI). "Attention needed" is ranked worst-first across all providers. This screen must render meaningfully with any subset of providers configured.

### 5.2 Service-centric navigation

The left rail lists **services** (from config + inference, §4.2), each with a status dot rolled up from everything related to it. Selecting a service opens its **cockpit** — a preset layout of panels automatically bound to that service via the Knowledge Graph:

```
Checkout                                          ● degraded
┌────────────┬──────────────────────┬────────────────────────┐
│ Repository │ Pods (qa)            │ Health & Metrics       │
│  PRs: 3    │  checkout-6df4… ⛔   │  hc: ✓  err: 2.3% ↑    │
│  CI: ✓     │  checkout-91ab… ✓    │  p95: 480ms            │
├────────────┼──────────────────────┼────────────────────────┤
│ Deploys    │ Logs (tail)          │ API · Dependencies     │
│  qa 14:32  │  …                   │  REST · → catalog      │
└────────────┴──────────────────────┴────────────────────────┘
```

The cockpit is crowned by a **Lineage strip** — the supply chain of the currently running version, walked left-to-right from the Knowledge Graph, every node a URI:

```
PR #248 (merged 2h, @alice) → Build #1842 ✓ → checkout:3.7.12 (sha256:4bf9…) → qa ✓ · staging ✓ · prod ⏳
```

This preserves *lineage*, not just a deployment list: during an incident, "what exactly is running, which build produced it, and who merged it" is one glance. When environments run different versions, the strip fans out per environment.

Tool-centric lenses (all repos, all environments, all APIs, observability) remain available below the service list — they're the same panels bound to workspace scope instead of a service.

### 5.3 Panels, not pages

Every capability in §6 ships as a **panel**: a self-contained, URI-parameterized component (`LogsPanel(logs://loki?service=checkout&env=qa)`, `PodsPanel(env://qa + service://checkout)`, `SecurityPanel(workspace)`).

- **Layouts** are named arrangements of panels, savable as **presets** ("Debugging", "Tech-lead review", "On-call"). Presets persist to `~/.dcc/layouts.json` and are palette-switchable.
- **v1 docking model (deliberately constrained):** a slot-based grid — split, resize, swap, and maximize panels within preset slots — rather than fully free-form floating/tabbed docking. Free-form docking (dockview-style) is the v2 upgrade path; the panel contract is identical either way. This keeps Phase 0 tractable without painting us into a corner.
- Panel library (v1): Workspace Health, Service Cockpit slots, Repos grid, PRs, Workflow Runs, Security, Environments, Pods, Pod detail, Deploys, Logs, Log search, REST explorer, GraphQL explorer, Health board, Error rates, Latency, Pinned dashboard, Context, Documents, Document viewer, Lineage strip, Artifacts, Audit log.
- Panels degrade independently: an unreachable provider turns *its* panels into inline error cards; the layout stands.

### 5.4 Command palette (⌘K) — first-class spec

The palette is the engineer's launcher and the primary navigation for power users.

**Index:** every URI in the workspace (services, repos, PRs, envs, workloads, pods, APIs, operations, dashboards, alerts, actions, layout presets, settings sections), refreshed with polling data. Fuzzy-matched with type-aware ranking (services > envs > workloads > leaf objects) and recency boost.

**Grammar:** `object`, `object → sub-object`, or `verb object`:

```
checkout                     restart checkout qa
├ Checkout Service      ●    ├ ⚡ Restart workload checkout @ qa   [confirm…]
├ Pods · qa                  logs checkout qa
├ Logs · qa                  ├ ⏵ Tail logs · checkout @ qa
├ Metrics (err/p95)          error
├ Repo · checkout-svc        ├ Error rates · workspace
├ OpenAPI explorer           ├ ⛔ checkout qa · CrashLoopBackOff
├ Deploy history             ├ ⚠ CodeQL critical · ui-kit
└ PRs (3 open)
```

**Progressive narrowing:** selecting a non-leaf result descends into its related objects (via the graph) without closing the palette — `error → Checkout → p95 latency → last deployment → tail logs` is one keyboard flow.

**Actions in the palette** use the identical safe-action framework (§7.1): selecting an action opens the same confirmation dialog (typed-name for `prod-like`); nothing executes from the palette without it.

**Other verbs:** `layout <preset>`, `pause polling`, `copy link <object>`, `settings <section>`, paste a URI to jump.

**Acceptance criteria:** first paint < 50ms after ⌘K; results < 100ms against a 500-URI index; every palette flow completable keyboard-only.

### 5.5 Context panel

A dockable panel (and a drawer available from any object header) that renders the Knowledge Graph neighborhood of the current object. Not passive "related links" — it answers: **everything you need to understand this object**, runtime and knowledge alike:

```
Checkout Service
 Repository   → checkout-svc (CI ✓, 3 PRs)
 Deployments  → qa (14:32, a1b2c3d) · staging
 Pods         → checkout-6df4… ⛔ · checkout-91ab… ✓
 APIs         → REST · (calls: catalog-graph)
 Dashboards   → Errors · Latency
 Security     → 3 CodeQL alerts
 Artifact     → checkout:3.7.12 (sha256:4bf9…) · built by Build #1842
 Documents    → ADR-0017 Extract pricing · Runbook: checkout on-call · README
 Owners       → @payments-team (CODEOWNERS)
 Depends on   → catalog        Used by → storefront
```

Every row is a URI link; edges show their provenance (declared / inferred / telemetry / knowledge) and evidence on hover. This panel is where the graph earns its keep — present by default in every service cockpit, and the on-call engineer's shortcut to the runbook.

---

## 6. Capability Views (panel families)

The four capability families from v0.1 survive intact — as panel libraries bound to either a service or the workspace — with their service layers, guardrails, and acceptance criteria.

### 6.1 Git (GitHub in v1)

**Purpose:** Monitor and manage repos and libraries; surface security posture at a glance — per service or across the workspace.

**Service layer:** `GitProvider` (§2.2). GitHub implementation: REST + GraphQL v4. Auth resolution order: `gh auth token` (if `auth: "gh-cli"`), else `tokenEnv`. The `gh` CLI is an optional accelerator, not a hard dependency.

**Normalized, independently queryable concepts:** Repository, PullRequest, Issue, WorkflowRun, Release, Package, SecurityAlert, Dependency. Each has a workspace-scoped query panel, enabling cross-repo questions like **"every failed workflow run across every repository"** or "all PRs awaiting my review" — not just per-repo tabs.

**Panels:**

1. **Repo grid** — one card per repo: default-branch CI status, open PR count, severity-weighted alert badge, last commit, tags. Sort/filter by tag, alert severity, staleness.
2. **Repo detail** — PRs (check status, review state, mergeability, age; deep links; safe action: **re-run failed checks**), branches & activity, releases.
3. **Workflow runs (workspace)** — all runs across repos, filterable by status/repo/branch; the "what's red in CI anywhere" panel.
4. **Security rollup (workspace)** — unified alert table merging Dependabot, CodeQL/code-scanning, and secret-scanning across all repos, normalized to `{ source, severity, title, repo, path?, firstSeen, url }`, severity-sorted. External scanners (e.g., Wiz) appear as an additional source; unreachable external APIs degrade to a link-out card.
5. **Dependencies** — for repos tagged `library`: reverse-dependency hints ("used by storefront, checkout-svc") from graph edges + package manifests when detectable.

**Acceptance criteria:**
- With `gh` authenticated and 5 repos configured, the repo grid fully renders in < 3s on warm cache.
- Alert counts match GitHub UI within one polling interval.
- The workspace workflow-runs panel answers "all failed runs, all repos, last 24h" in one query interaction.
- Re-run CI requires a confirmation dialog and appears in the audit log.

### 6.2 Environments & Workloads

**Purpose:** Answer "what is running, where, and is it healthy?" across K8s, Vercel, and Cloudflare through one normalized UI.

**Service layer:** `DeploymentProvider` implementations — `@kubernetes/client-node` over local kubeconfig contexts; Vercel REST API; Cloudflare API.

**Panels:**

1. **Environment overview** — per environment: normalized status rollup (worst-of), workload count, last deploy time + version/SHA, provider icon, tier badge.
2. **Environment detail (K8s)** — namespaces → workloads (Deployments/StatefulSets/CronJobs) → pods. Per pod: phase, readiness, restart count (highlight > 3), age, image tag, requests vs usage if metrics-server is available. Crash-looping pods float to the top, always.
3. **Pod detail drawer** — recent events, container statuses, env-var *names* (values masked), live log tail (follow, pause, client-side grep). Safe actions: **restart workload** (rollout restart, never pod delete), **view manifest** (read-only YAML).
4. **Vercel/Cloudflare detail** — deployments (state, branch, commit, duration, URL), function/worker status, link-outs. Safe action where the provider declares it: **trigger deploy / redeploy**.

**Acceptance criteria:**
- Switching environments never blocks the UI; stale data remains visible with its timestamp while new data loads.
- Restart workload: dialog states env, tier, workload, provider; `prod-like` requires typing the workload name; action + result audit-logged.
- A missing/unreachable kube context degrades to an inline error card for that environment only.

### 6.3 API Playground

**Purpose:** Ingest API specs by URL; provide docs + examples + a request runner; visualize how APIs connect.

**Service layer:** `ApiProvider` (§2.2). Ingestion: fetch spec URL server-side; parse OpenAPI 3.x, Swagger 2.0 (auto-converted to OAS3 via `swagger2openapi`), or GraphQL (introspection, or SDL if returned). Cache parsed spec locally; "refresh spec" button; show spec version + fetch time. **Request proxy:** all playground requests go through `/api/apis/proxy` — auth headers injected server-side from `tokenEnv`, CORS a non-issue, base URL selected by environment.

**Panels:**

1. **Service API catalog** — configured APIs with type badge, spec health (fetched OK / stale / failed), linked service/repo, available environments.
2. **REST explorer** — three-pane: operations tree (by tag) → operation doc (params, schemas rendered human-readably, auto-generated examples) → request runner (prefilled method/URL, editable headers/query/body with JSON validation, environment picker, **Send**). Response: status, latency, headers, pretty/raw body. History of last 50 requests per API, persisted locally, with "copy as curl".
3. **GraphQL explorer** — schema-aware editor (autocomplete from introspection, docs sidebar, variables pane), same environment picker and history.
4. **API dependency map** — a graph view of service→service call edges: `checkout → catalog → pricing`. Edges sourced (in priority order) from OTel service-graph metrics, OpenAPI `links`/`x-dependencies`, and manual `dependsOn` config; provenance shown per edge. Clicking a node opens that service's cockpit; clicking an edge lists the operations involved where known. This is the "visualize the architecture" view.

**Guardrails:** the proxy only sends to base URLs present in config (no arbitrary-URL relay). Mutating verbs against `prod-like` base URLs show a warning banner before send.

**Acceptance criteria:**
- A Swagger 2.0 URL and an OAS 3.1 URL both render docs and runnable examples with zero config beyond the URL.
- GraphQL autocomplete works against any introspection-enabled endpoint.
- Auth tokens never appear in the browser (verifiable in devtools — headers injected by proxy only).
- The dependency map renders from manual `dependsOn` edges alone when no telemetry is available.

### 6.4 Observability & Correlation

**Purpose:** Quick health checks, error-rate and latency views, log search — and, distinctively, **correlation**: connecting a symptom to its cause across providers. The app tells a story, not isolated facts.

**Service layer:** `ObservabilityProvider` implementations — Prometheus HTTP API (instant + range), Loki (LogQL), Grafana (dashboard metadata + deep links), Tempo (trace by ID), Vercel observability where available. All optional; each configured backend lights up its panels.

**Panels:**

1. **Health board** — grid of configured HTTP health checks (status + latency + last change, probed from the BFF) plus per-environment rollups plus top-line error sparkline per service. One glance = "what's on fire." Feeds §5.1.
2. **Error rates** — per-service error-rate chart (default PromQL templates, overridable per service), time-range picker (15m/1h/6h/24h/7d), **deploy markers** overlaid from deploy history.
3. **Latency** — per-route p50/p95/p99 table + chart from OTel/Prometheus histograms; Vercel route-level data for Next.js-on-Vercel. Sortable by p95.
4. **Log search** — LogQL-backed with service/env/severity pickers compiled to label matchers, free-text filter, time range, live tail. Log lines link to traces when `trace_id` is present. "Open in Grafana" preserves the query.
5. **Correlation thread** — the on-call storyline. Starting from any anomaly (error spike, failing health check, crash-looping pod), DCC walks the Knowledge Graph and assembles a vertical timeline:

```
 14:32  Deployment · checkout @ qa · a1b2c3d          deploy://…
        └ consumed checkout:3.7.12 · Build #1842      artifact://… run://…
 14:33  Error rate 0.2% → 4.7%                        dashboard://errors
 14:33  ✗ POST /orders 500 ×214                       logs://…
        └ trace 4bf92f35 · NPE in PricingClient       trace://…
 14:32  PR #482 "Extract pricing client" · merged     pr://…
        └ commit a1b2c3d · @jdoe                      repo://…
 ─────
 Suggested next steps:  ⏪ view diff · ⚡ restart workload · 📄 tail logs
```

Every row is a URI. The chain is heuristic (SHA match, time-window overlap, trace/log linkage) and each link states its evidence; DCC proposes the story, the engineer verifies it. v1 scope: deploy ↔ artifact/build ↔ metric-window ↔ logs ↔ trace ↔ PR/commit/author.

6. **Pinned Grafana dashboards** — embedded via shareable panels where auth allows; otherwise link cards. Never block on Grafana reachability.

**Acceptance criteria:**
- Health board renders meaningfully with *only* health-check URLs configured (no Prom/Loki required).
- Log search round-trip < 2s against a healthy Loki for a 1h window.
- Deploy markers appear on error-rate charts wherever deploy history exists for that service/env.
- From an error spike, the correlation thread reaches the deploying PR/commit in ≤ 2 clicks when a SHA match exists.

### 6.5 Knowledge (v1: repo-markdown)

**Purpose:** Make engineering knowledge a first-class citizen of the graph with near-zero ceremony.

**Service layer:** `KnowledgeProvider` (§2.2). v1 implementation *repo-markdown*: discovers `README*`, `docs/**`, and `adr|adrs|rfcs|runbooks/**` in configured repos via the Git provider; classifies `kind` by path/frontmatter heuristics (`docs/adr/*` → ADR, `runbooks/*` → runbook, else note); extracts markdown cross-links as doc→doc edges; links documents to services via the resolver (§4.2 step 6).

**Panels:** **Documents** (list for a service or the workspace, filterable by kind) and **Document viewer** (rendered markdown; internal links that resolve to workspace URIs navigate in-app, others open externally). Documents surface primarily through the Context panel and palette rather than as a destination.

**Acceptance criteria:** a repo containing a README and `docs/adr/0017-*.md` yields `doc://` URIs, correct kinds, service linkage, and palette hits with zero configuration.

---

## 7. Cross-Cutting Features

### 7.1 Safe-action framework
- Single executor at `/api/actions/*`; every action declares `{ id, provider, targetUri, tier, requiredConfirmation }`.
- Confirmation UX: standard dialog for `sandbox`/`shared`; typed-name confirmation for `prod-like`; dialogs state exactly what will happen and against what. Identical whether invoked from a panel or the palette.
- **Audit log:** append-only JSONL at `~/.dcc/audit.log` — `{ ts, action, targetUri, env, result, durationMs }`. Viewable in-app (Settings → Audit).
- Kill switch: `actions.enabled: false` hides all action affordances app-wide.

### 7.2 Workspace status bar
Persistent bottom bar: active workspace name, active layout preset, polling status, aggregate alert count, clock, and a "system OK / N issues" beacon mirroring Workspace Health.

---

## 8. UX & Design Direction (for Claude Design)

- **Theme:** dark-only in v1. Near-black background (not pure #000), one accent color, restrained syntax-highlight palette for logs/JSON. Status colors are the only saturated colors on screen: green/amber/red/blue(deploying)/gray(unknown) — colorblind-safe pairs with icons, never color alone.
- **Density:** information-dense but calm. Tables over cards where data is comparable. Generous line-height in logs. Monospace (JetBrains Mono or similar) for identifiers, URIs, logs, JSON; a clean grotesque for UI chrome.
- **Layout:** left rail = **services** (status-dotted) with capability lenses beneath; content area = the panel grid; right-side drawers for object detail (pod drawer, Context) so context is never lost; status bar bottom.
- **Motion:** minimal; only state-change transitions (status color fades, drawer slides, panel swap). No skeleton shimmer storms — prefer stale-data-with-timestamp over spinners.
- **Empty/error states:** every panel needs a designed empty state ("No services configured → Add in Settings") and a degraded state (provider unreachable) — first-class designs, not afterthoughts.
- **Surface inventory to design:** Workspace Health (home), service left rail, Service Cockpit (default layout), the full panel library (§5.3) in grid slots, panel maximized state, layout preset switcher, command palette (all states incl. progressive narrowing and inline action confirm), Context panel + drawer (incl. Artifact/Documents/Owners rows), Documents list + Document viewer, Lineage strip (single + fanned-out states), correlation thread, API dependency map, pod drawer, Settings (per-section forms + reference pickers + connection tests + config diff + Resolution inspector), config-repair screen, audit log, all confirmation dialogs (standard + typed-name), degraded/empty states for every panel.

---

## 9. Tech Stack & Implementation Notes (for Claude Code)

| Concern | Choice |
|---|---|
| Framework | Next.js 15+ (App Router), React 19, TypeScript strict |
| Styling | Tailwind CSS v4 + shadcn/ui (Radix under the hood) |
| Client/UI state | Zustand (layouts, palette, selections, drawer stack, polling toggle) |
| Server-state cache | TanStack Query (polling, retries, stale-while-revalidate) |
| Panel layout | v1: CSS-grid slot engine (own code, small); v2 path: `dockview` |
| URI routing | Internal resolver `Uri → { panel, params }`; mirrored to URL for deep links |
| Knowledge graph | In-memory adjacency (plain maps) behind `/api/graph/*`; rebuilt on config load, enriched by providers |
| Validation | Zod schemas, generated in tandem with JSON Schema (`zod-to-json-schema`); reference-integrity pass |
| K8s | `@kubernetes/client-node` |
| OpenAPI | `@readme/openapi-parser` or `@apidevtools/swagger-parser` + `swagger2openapi` |
| GraphQL | `graphql` + introspection; CodeMirror 6 for the editor |
| Charts / graph viz | `recharts` (or `uPlot` for high-frequency series); force/dagre layout for the dependency map |
| Logs streaming | SSE from route handlers |
| Config file I/O | Node `fs` in route handlers + `chokidar` watcher |

**Project conventions:** `src/lib/domain/*` (canonical types + URI codec — the §3 vocabulary lives here and everything imports it), `src/lib/providers/{git,deployment,observability,api}/*` for interface + implementations, `src/lib/graph/*` for relationships, `src/app/api/*` route handlers thin (validation + delegation), all upstream responses normalized at the provider layer before reaching the UI.

**Runtime:** `dcc dev` / `next start -p 7777`, bound to `127.0.0.1` only. No telemetry, no external calls except configured upstreams.

---

## 10. Security Model

1. **Localhost binding only** (`127.0.0.1`); refuse to start if configured otherwise without an explicit `--unsafe-host` flag.
2. **Secrets** only from environment variables / `gh` CLI / kubeconfig; never written to disk by DCC; never sent to the browser; masked in all UI (env-var names shown, values never).
3. **Request proxy allow-list:** playground and health checks can only call URLs derived from config.
4. **Least-privilege guidance** in docs: read-mostly Git token scopes; kube contexts can be read-only service accounts except where restart is wanted.
5. **Audit log** for every action (§7.1).
6. **No prod tier assumed:** environments default to `shared`; `prod-like` must be opted into per environment, activating stricter confirmations.

---

## 11. Milestones (suggested Claude Code phasing)

Phase 0 is deliberately a **vertical slice**, not a horizontal foundation: the domain model, provider interfaces, and service cockpit proven end-to-end against one real provider (GitHub). If those concepts feel natural in a working app, everything else grows on top of them; if they don't, we find out in week one.

| Phase | Scope | Exit criteria |
|---|---|---|
| **0. Vertical slice** | Domain model + URI codec, config load/validate/repair + inference resolver (v0: repo↔service matching), provider interfaces, **GitProvider (GitHub) end-to-end**, panel slot engine, **minimal service cockpit** (Repository/PRs/Security panels bound via the Knowledge Graph), palette shell, theme + left rail | Select a service → cockpit renders live GitHub data; every rendered object has a copyable URI; graph edges + provenance inspectable; invalid config or dangling refs show repair screen |
| **1. Git depth + knowledge** | Repo grid/detail, workspace workflow-runs + security rollup, re-run CI action + audit log; repo-markdown KnowledgeProvider, Documents/viewer, Context panel v1; Workspace Health (git-scope) | §6.1 and §6.5 acceptance criteria pass |
| **2. Environments + lineage** | K8s provider + resolver workload inference, env panels, pod drawer, log tail, restart action; cockpit gains Pods/Deploys/Logs + **derived Lineage strip** (workload image ↔ run ↔ PR by SHA, no registry needed); Resolution inspector | §6.2 criteria pass; `{ "id": "checkout" }` alone binds repo + workloads; lineage strip resolves PR→build→image→env when SHAs match |
| **3. API Playground** | Spec ingestion (OAS3/Swagger2), REST explorer, proxy; then GraphQL; dependency map from `dependsOn` | §6.3 criteria pass (map from manual edges) |
| **4. Observability** | Health board, error/latency panels, Loki log search, deploy markers; Workspace Health fully live | §6.4 criteria 1–3 pass |
| **5. Correlation + palette depth** | Correlation thread (deploy↔metric↔log↔trace↔PR), palette progressive narrowing + actions, OTel-derived map + dependency edges | §6.4 criterion 4 and §5.4 criteria pass |
| **6. Providers+** | Vercel + Cloudflare adapters, Vercel observability, trigger-deploy action; first `ArtifactProvider` (GHCR/GitHub Packages via existing GitHub auth) enriching derived Artifact nodes with version history + publish metadata | Normalized status verified across 3 providers; registry metadata merges into existing lineage without model changes |
| **7. Polish** | Settings full CRUD + reference pickers + connection tests + diff preview, layout presets UX, audit viewer, empty/degraded states, keyboard map | Design QA against §8 |

**A note on scope discipline:** this document is now the architectural north star, not a backlog. The biggest remaining risk is the spec becoming more sophisticated than the software needs to be. Resist expanding it; let further sophistication be earned by the working application, and fold learnings back here only when code proves them.

---

## 12. Open Questions (flag during redline)

1. Should request history / playground bodies persist to disk (`~/.dcc/`) or stay in-memory per session? (Spec assumes disk, capped at 50/API.)
2. Wiz integration: API-level ingestion vs. link-out only in v1? (Spec assumes link-out with optional token-based summary.)
3. Do CronJobs/Jobs need first-class K8s views in v1, or Deployments/StatefulSets only?
4. Error-rate queries: ship opinionated default PromQL templates, or require per-service queries in config? (Spec assumes defaults + override.)
5. Any appetite for a read-only "share this view" static export (e.g., snapshot HTML) for pasting into incident channels? (Correlation threads would export beautifully.)
6. OTel-derived dependency edges assume service-graph metrics exist (e.g., Tempo metrics-generator). Is that available in your stack, or should v1 lean on manual `dependsOn` + OpenAPI links only?
7. Correlation confidence: should low-evidence links (time-window overlap only, no SHA/trace match) be shown with a "weak" badge, or hidden entirely?
8. Palette index scale: at what workspace size (pods churn constantly) do we cap leaf-object indexing and fall back to on-demand descent? (Spec assumes full index ≤ ~2k URIs.)
9. Owners: is `CODEOWNERS` sufficient as the v1 ownership source, or is a config-level `owners` field needed for teams that don't maintain it?
10. Inference trust: should inferred bindings require one-time acknowledgment in the Resolution inspector before driving *actions* (a restart against an inferred workload match), or is provenance display enough?
11. Which registries are actually in your stack (GHCR? ECR? Artifactory?) — determines the second `ArtifactProvider` after GHCR.
12. Appetite for SBOM/SLSA provenance display on Artifact nodes once a registry provider lands, or is that v3 territory?
