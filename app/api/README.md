# `app/api`

Route handlers — the local BFF / service layer (§2).

They exist even though the app runs on localhost because they give us four
things a browser-direct fetch cannot: CORS-free access to upstreams, credential
isolation (tokens never enter the client bundle), response normalization across
providers, and a single choke point for the audit log and the proxy allow-list.

**Handlers stay thin: validate, delegate, return.** Parse and validate input
with the Zod schemas, call into `lib/providers` or `lib/graph`, serialize. No
upstream SDK calls, no business logic, no normalization here — that all lives
in the provider layer.

Planned surface:

```
config/    read / validate / write the JSON config
git/       → GitProvider
deploy/    → DeploymentProvider
obs/       → ObservabilityProvider
apis/      → ApiProvider (spec ingest + proxy)
graph/     → Knowledge Graph queries
actions/   → safe-action executor + audit log
```

Route handlers rather than Server Functions, deliberately: this layer is
dominated by *reads* that want stable, addressable GET endpoints TanStack Query
can poll and cache by URL, SSE for log streaming, and an HTTP surface you can
hit with `curl` when debugging DCC itself at 2am.
