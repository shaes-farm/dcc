# `lib/providers`

The plugin system (§2.2). Every integration category sits behind an interface;
concrete vendors are implementations, not features.

```
git/            GitProvider           — GitHub (v1), GitLab, Azure DevOps
deployment/     DeploymentProvider    — Kubernetes (v1), Vercel, Cloudflare
observability/  ObservabilityProvider — Prometheus, Loki, Tempo, Grafana
api/            ApiProvider           — OpenAPI + GraphQL spec ingest and proxy
```

Two rules hold across all of them:

- **Normalize at this layer.** Upstream responses become `lib/domain` types
  before they leave a provider. Status in particular collapses to the shared
  vocabulary `healthy | degraded | failing | deploying | unknown`, with the
  mapping documented in code (K8s `CrashLoopBackOff` → `failing`, Vercel
  `BUILDING` → `deploying`, missing metrics → `unknown` — never guess
  `healthy`).
- **Declare capabilities.** Providers self-describe via `capabilities()`, and
  the UI renders only what a provider declares. No capability, no affordance.

Credentials are read server-side from environment variables, the `gh` CLI, or
kubeconfig, and never cross into the browser bundle.

Interfaces defined by [#5](https://github.com/shaes-farm/dcc/issues/5); the
first implementation is the GitHub `GitProvider`
([#11](https://github.com/shaes-farm/dcc/issues/11)).
