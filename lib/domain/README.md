# `lib/domain`

The §3 vocabulary. Canonical object types (Service, Repository, PullRequest,
Environment, Workload, Deploy, Artifact, Document, …) and the resource-URI
codec that addresses them.

Everything imports from here; this directory imports from nothing else in
`lib/`. Providers normalize upstream payloads *into* these types before the
data reaches a route handler or the UI — that is what keeps GitHub-shaped or
Kubernetes-shaped fields from leaking across the app.

Filled by [#2](https://github.com/shaes-farm/dcc/issues/2) (canonical types)
and [#3](https://github.com/shaes-farm/dcc/issues/3) (URI codec).
