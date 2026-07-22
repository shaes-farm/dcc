# `lib/graph`

The Knowledge Graph (§3.3): relationships between domain objects, held as
in-memory adjacency (plain `Map`s — no graph database).

Rebuilt on config load and enriched by providers as they fetch. Every edge
carries provenance, so the UI can always answer "why do you think these two
things are related?" — declared in config, inferred by the resolver, or
derived from upstream data.

Queried through `app/api/graph/*`; the UI never reaches in here directly.

Filled by [#10](https://github.com/shaes-farm/dcc/issues/10).
