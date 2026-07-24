/**
 * The `dcc.config.json` schema (spec §4.1) — the *declared input* to DCC.
 *
 * This is deliberately **not** the `lib/domain` vocabulary. Those types are the
 * *resolved output* of the inference resolver: they carry a `uri`, a rolled-up
 * `status`, and arrays of resolved URIs. What an engineer writes in
 * `dcc.config.json` is inference-first and reference-by-id — a service can be as
 * small as `{ "id": "checkout" }` and everything else is derived (§4.2). Every
 * field here maps to a domain field, but the shapes differ and must stay
 * separate; widening one to match the other is the failure this codebase is
 * organized to prevent.
 *
 * Zod lives here (and at route-handler boundaries), never in `lib/domain`: this
 * is where untrusted external data — a hand-edited JSON file — actually enters
 * the app. One schema definition drives two artifacts: runtime validation
 * (`dccConfigSchema.parse`) and editor autocomplete + inline validation (the
 * generated `schema/dcc.schema.json`, referenced via `$schema`). See ADR-0003
 * for why the JSON Schema is emitted by Zod 4's native `z.toJSONSchema` rather
 * than the `zod-to-json-schema` package §9 named.
 *
 * Reuse the domain's closed-union `const` arrays (e.g. `ENVIRONMENT_TIERS`) so
 * config and resolved types share exactly one vocabulary.
 */

import { z } from "zod";

import { ENVIRONMENT_TIERS } from "@/lib/domain";

/**
 * Every reference in this file is an **id string**, never a `Uri`. Config is a
 * reference graph keyed by id (§4.1); URIs are minted later, at resolution. A
 * named alias documents intent at each reference site.
 */
const idRef = z.string().min(1);

/**
 * Secrets are env-var *names*, never values (§10.2). Every credential-bearing
 * shape carries `tokenEnv` — the name of the environment variable DCC resolves
 * server-side at runtime — and no field anywhere accepts a raw token. The
 * schema test asserts this structurally.
 */
const tokenEnv = z.string().min(1).meta({
  description:
    "Name of the env var holding the credential — never the credential itself (§10.2).",
});

/**
 * Provider auth: either the `gh` CLI / kubeconfig (no token in play) or a named
 * env var. Providers whose auth is implicit (a kube context) simply omit this.
 */
const providerAuth = z.union([
  z.literal("gh-cli"),
  z.strictObject({ tokenEnv }),
]);

/**
 * A configured integration instance (§4.1 `providers`). `kind` is the vendor
 * behind the instance (`github`, `kubernetes`, `vercel`, `grafana`, …), kept an
 * open string in v1 rather than a per-vendor discriminated union — the §4.1
 * example is the coverage bar, and vendors expand faster than the schema should
 * churn. Vendor-specific fields (`kubeContext`, `teamId`, `url`, …) are optional
 * and passthrough for the same reason.
 */
const providerConfig = z
  .object({
    id: idRef,
    kind: z.string().min(1),
    label: z.string().optional(),
    auth: providerAuth.optional(),
    tokenEnv: tokenEnv.optional(),
    // Vendor-specific settings from the §4.1 example. Optional in v1; a later
    // issue may tighten these into per-`kind` discriminated unions.
    kubeContext: z.string().optional(),
    teamId: z.string().optional(),
    accountId: z.string().optional(),
    url: z.string().optional(),
    reportUrl: z.string().optional(),
  })
  .meta({ id: "ProviderConfig", title: "Provider" });

/**
 * Providers are grouped by integration category (§4.1). Note the divergence
 * from the domain's `PROVIDER_KINDS`: config buckets everything non-core under
 * `external`, whereas the domain splits `api | issue | knowledge | artifact`.
 * Mirror the config grouping the spec shows here; the resolver reconciles them.
 */
const providersConfig = z
  .strictObject({
    git: z.array(providerConfig).optional(),
    deployment: z.array(providerConfig).optional(),
    observability: z.array(providerConfig).optional(),
    external: z.array(providerConfig).optional(),
  })
  .meta({ id: "ProvidersConfig", title: "Providers" });

const workspaceConfig = z
  .strictObject({
    name: z.string().min(1),
    // An environment **id** here, not the resolved `Uri` the domain Workspace
    // carries. Resolution turns it into `env://…`.
    defaultEnvironment: idRef.optional(),
  })
  .meta({ id: "WorkspaceConfig", title: "Workspace" });

const repositoryConfig = z
  .strictObject({
    id: idRef,
    provider: idRef,
    owner: z.string().min(1),
    name: z.string().min(1),
    tags: z.array(z.string()).optional(),
  })
  .meta({ id: "RepositoryConfig", title: "Repository" });

const environmentConfig = z
  .strictObject({
    id: idRef,
    label: z.string().min(1),
    provider: idRef,
    tier: z.enum(ENVIRONMENT_TIERS),
    // Provider-shaped scopes; which apply depends on the backing provider kind.
    namespaces: z.array(z.string()).optional(),
    projectIds: z.array(z.string()).optional(),
    workers: z.array(z.string()).optional(),
  })
  .meta({ id: "EnvironmentConfig", title: "Environment" });

/**
 * An API spec entry (§4.1 `apis`). `type` mirrors the spec's literal
 * `openapi | graphql`; note this differs from the domain's `ApiKind`
 * (`rest | graphql`) — Swagger/OpenAPI collapse to `rest` only after ingestion.
 */
const apiConfig = z
  .strictObject({
    id: idRef,
    type: z.enum(["openapi", "graphql"]),
    url: z.string().min(1),
    auth: z.strictObject({ kind: z.literal("bearer"), tokenEnv }).optional(),
  })
  .meta({ id: "ApiConfig", title: "API" });

const dashboardConfig = z
  .strictObject({
    id: idRef,
    provider: idRef,
    uid: z.string().min(1),
  })
  .meta({ id: "DashboardConfig", title: "Dashboard" });

const healthCheckConfig = z
  .strictObject({
    id: idRef,
    name: z.string().min(1),
    url: z.string().min(1),
    expectStatus: z.int().optional(),
  })
  .meta({ id: "HealthCheckConfig", title: "Health check" });

/**
 * The inference-first service (§4.2). Only `id` is required; every other field
 * is an *override* of what the resolver would otherwise derive by convention.
 * All references are id strings.
 */
const serviceConfig = z
  .strictObject({
    id: idRef,
    name: z.string().optional(),
    // Needed only when the repo id differs from the service id (§4.2 step 1).
    repository: idRef.optional(),
    apis: z.array(idRef).optional(),
    workloadSelector: z
      .strictObject({
        namespace: z.string().optional(),
        labels: z.record(z.string(), z.string()).optional(),
      })
      .optional(),
    // Per-environment base URL, keyed by environment id.
    baseUrls: z.record(z.string(), z.string()).optional(),
    dependsOn: z.array(idRef).optional(),
  })
  .meta({ id: "ServiceConfig", title: "Service" });

const actionsConfig = z
  .strictObject({
    enabled: z.boolean(),
    allow: z.array(z.string()),
    confirmPhraseForTiers: z.array(z.enum(ENVIRONMENT_TIERS)).optional(),
  })
  .meta({ id: "ActionsConfig", title: "Actions" });

const uiConfig = z
  .strictObject({
    pollingSeconds: z.record(z.string(), z.int()).optional(),
  })
  .meta({ id: "UiConfig", title: "UI" });

/**
 * The root config (§4.1). Optionality mirrors the spec: a workspace with no
 * environments or actions yet is valid.
 *
 * Reference-integrity (dangling id) validation is intentionally *not* here: it
 * needs the whole config in hand and belongs with the config loader/repair
 * screen (§4.3). This root schema leaves a clean seam — a future
 * `.superRefine((cfg, ctx) => …)` collecting declared ids and flagging
 * dangling references attaches here without touching the per-field shapes.
 */
export const dccConfigSchema = z
  .strictObject({
    $schema: z.string().optional(),
    workspace: workspaceConfig,
    providers: providersConfig.optional(),
    repositories: z.array(repositoryConfig).optional(),
    environments: z.array(environmentConfig).optional(),
    apis: z.array(apiConfig).optional(),
    dashboards: z.array(dashboardConfig).optional(),
    healthChecks: z.array(healthCheckConfig).optional(),
    services: z.array(serviceConfig).optional(),
    actions: actionsConfig.optional(),
    ui: uiConfig.optional(),
  })
  .meta({
    id: "DccConfig",
    title: "DCC configuration",
    description:
      "Workspace configuration for the Developer Control Center (dcc.config.json, spec §4.1).",
  });

export type DccConfig = z.infer<typeof dccConfigSchema>;
export type ProvidersConfig = z.infer<typeof providersConfig>;
export type ServiceConfig = z.infer<typeof serviceConfig>;
export type ProviderConfig = z.infer<typeof providerConfig>;
