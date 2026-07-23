# `lib/domain`

The §3 vocabulary. Canonical object types (Service, Repository, PullRequest,
Environment, Workload, Deployment, Artifact, Document, …) and the resource-URI
codec that addresses them.

Everything imports from here; this directory imports from nothing else in
`lib/`. Providers normalize upstream payloads _into_ these types before the
data reaches a route handler or the UI — that is what keeps GitHub-shaped or
Kubernetes-shaped fields from leaking across the app. The rule is enforced by
an ESLint `no-restricted-imports` block in `eslint.config.mjs`, not left to
discipline.

## Layout

Files are grouped by **lifecycle stage** (§3.0), not one per type, because that
is the order the objects actually connect in:

```text
Knowledge → Planning → Source → Build → Artifact → Deploy → Runtime → Observe
```

| File               | Holds                                                                          |
| ------------------ | ------------------------------------------------------------------------------ |
| `common.ts`        | `Status`, `Severity`, `IsoDateTime`, `Actor`, `CommitRef`                      |
| `uri.ts`           | `Uri`, `UriScheme`, `ParsedUri` — and the codec that reads and writes them     |
| `provider.ts`      | `Provider` — a configured integration instance                                 |
| `workspace.ts`     | `Workspace`, `Service`                                                         |
| `knowledge.ts`     | `Document`                                                                     |
| `git.ts`           | `Repository`, `PullRequest`, `Issue`, `Release`, `SecurityAlert`, `Dependency` |
| `build.ts`         | `WorkflowRun`                                                                  |
| `artifact.ts`      | `Artifact`, `ArtifactProvenance`                                               |
| `deployment.ts`    | `Environment`, `Deployment`                                                    |
| `workload.ts`      | `Workload`, `Pod`                                                              |
| `api.ts`           | `Api`, `Operation`                                                             |
| `observability.ts` | `Dashboard`, `HealthCheck`, `LogStream`, `Trace`                               |
| `action.ts`        | `Action`                                                                       |
| `index.ts`         | The barrel — import `@/lib/domain`, never a submodule                          |

## Conventions

- **Plain TypeScript types, no external dependencies.** These are the
  normalized _output_ of providers, not untrusted input; Zod belongs at the
  config ([#6](https://github.com/shaes-farm/dcc/issues/6)) and route-handler
  boundaries, where external data actually enters. The URI codec is the one
  piece of runtime code here, because a URI's grammar has to live with the
  vocabulary it addresses.
- **Every addressable object carries `uri`.** Anything rendered is copyable as
  a link, and history, favorites, layout presets, and graph edges store URIs
  and nothing else (§3.2). `formatUri` and `toUri` are the only ways to mint
  one — a `Uri` is branded, so a bare string cannot drift into a URI field.
- **Timestamps are ISO-8601 strings**, never `Date` — these shapes cross the
  route-handler JSON boundary and are cached by TanStack Query.
- **Closed unions ship as a `const` array plus a derived type**
  (`STATUSES` → `Status`), so the UI can iterate the options and tests can
  assert the set.
- **Optional means "a provider may not know this"**, never "unimportant". A
  derived `Artifact` starts as little more than a name and a digest and gains
  fields as matching succeeds; `unknown` status always beats a guessed
  `healthy` (§2.2).
- **No provider-specific fields.** If it only makes sense for GitHub or only
  for Kubernetes, it belongs in `lib/providers`.

## Two naming decisions worth knowing

- **`Provider` vs `ProviderAdapter`.** §3.1 names the configured integration
  instance `Provider`; §2.2 gives the same name to the plugin interface with
  `capabilities()` and `testConnection()`. Domain owns the data-only noun;
  [#5](https://github.com/shaes-farm/dcc/issues/5) names the behavioral
  contract `ProviderAdapter` and extends this one.
- **Two kinds of provenance.** `Artifact.provenance` is supply-chain
  attestation (SBOM, SLSA). Knowledge Graph edge provenance
  (`declared | inferred | telemetry | knowledge`, §3.3) is a different concept
  living in `lib/graph`. They must not be unified.

## Known gap: five objects have no URI scheme

`Issue`, `Release`, `Dependency`, `Provider`, and `HealthCheck` are canonical
objects in §3.1, but §3.2 enumerates no scheme for them and §5.4 does not index
them in the palette. They carry no `uri` here and are reached through a parent
— the repository, the service, or Settings.

Resolving this means amending §3.2 first, then adding the scheme to
`URI_SCHEMES` and its grammar to `SCHEME_CODECS` — the codec's per-scheme
record is keyed by `UriScheme`, so the first half without the second is a type
error. Minting `issue://` or `hc://` locally would fork the codec's grammar
from the spec it implements.

Filled by [#2](https://github.com/shaes-farm/dcc/issues/2) (canonical types)
and [#3](https://github.com/shaes-farm/dcc/issues/3) (the URI codec).
