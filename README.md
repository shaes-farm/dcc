# Developer Control Center (DCC)

> An IDE for distributed systems — a single, coherent view of a software project's structure, state, workflows, and operational signals.

## Status

**Pre-build.** There is no application code in this repository yet.

The specification is frozen at **v0.4** and is the architectural north star: [docs/developer-control-center-spec.md](docs/developer-control-center-spec.md). Phase 0 is a deliberate vertical slice — domain model and URI codec, config load/validate, provider interfaces, the GitHub provider end-to-end, and a minimal service cockpit — rather than a horizontal foundation. If those concepts feel natural in a working app, everything else grows on top of them; if they don't, we find out in week one.

---

## Overview

Modern software systems are complex ecosystems. The code lives in repositories. The infrastructure lives in cloud consoles. The operational state lives in dashboards. The workflows live in scripts. The decisions live in documents, tickets, and conversations. The knowledge needed to work effectively is distributed across dozens of disconnected tools.

Developer Control Center exists to bring that knowledge together. It is a workspace that provides one view of a software project: its structure, current state, workflows, documentation, dependencies, and operational signals.

Three things define what it is in practice:

* **Local-only.** It runs on your machine, binds to localhost, and uses the credentials already there — your `gh` auth, your kubeconfig, your environment variables. Single user. No hosted service, no server-side tenancy, no secrets stored on disk.
* **Project-agnostic.** Everything it shows is driven by a JSON config file, so the same tool adapts to any project following similar conventions — Git hosting for source, Kubernetes/Vercel/Cloudflare for hosting, OpenAPI/GraphQL for APIs, an OpenTelemetry/Grafana stack for observability.
* **Organized around services, not tools.** You debug *Checkout*. You don't "look at Kubernetes."

The goal is not to replace every tool developers already use. The goal is to eliminate the constant reconstruction of context required to use them.

---

## The Problem

A developer working on an unfamiliar project must answer the same questions over and over:

* What is this system?
* How is it structured?
* What services exist?
* How do I run it?
* What environment am I working in?
* What changed recently?
* What is currently broken?
* Where is the documentation?
* Why was it designed this way?
* Who owns this area?
* What should I do next?

The answers exist, but they are fragmented. Developers spend significant time performing archaeology: searching repositories, reading documentation, inspecting configuration files, checking dashboards, exploring cloud consoles, asking teammates, and reconstructing decisions made months or years earlier.

The same questions are asked under much worse conditions. An alert fires at 2am and the on-call engineer needs to know what changed, what's failing, and what to do about it — while tired, with a dozen browser tabs, against a system they may not have touched in weeks. That scenario, not the leisurely onboarding read, is what this tool is built for.

Developer Control Center turns the project itself into the interface.

---

## Vision

Developer Control Center models a software system as a **delivery lifecycle**, not a pile of resources:

```text
Knowledge → Planning → Source → Build → Artifact → Deploy → Runtime → Observe
```

This is a stronger organizing principle than "GitHub + Kubernetes + Grafana," because it reflects how the pieces actually relate. A deployment doesn't produce a container; it **consumes** one. A repository doesn't deploy; it **produces** artifacts via workflows. New capabilities — artifact registries, SBOMs, provenance attestations, vulnerability scanners — attach to existing lifecycle stages without changing the model.

The system should understand not only **what exists**, but also how pieces connect, how they are operated, why they exist, and how they have changed.

### The Service Is the Unit of Thought

The **Service** is the primary object — a logical application or component you actually think in terms of (Checkout, Storefront, UI Library). Navigation, search, and layout all organize around services. Selecting one opens its *cockpit*: repository state, running pods, deploys, logs, health, APIs, and dependencies, all bound to that service at once.

Tool-centric views — all repositories, all environments, all APIs — remain available as alternate lenses. They are not the spine.

Configuration describes only what cannot be inferred. A service can be as small as `{ "id": "checkout" }`; DCC derives the rest by walking conventions, and every derived binding is inspectable with its evidence. Inference without inspection is a 2am trap.

### The Knowledge Graph

Underneath everything is a typed graph of edges between entities, modeling *engineering knowledge* rather than just runtime state: what runs where, but also what documents explain it, what decisions shaped it, what depends on it, and who owns it.

Providers exist to enrich the graph. Panels exist to render slices of it. Search, context, correlation, and the dependency map are all just queries against it.

Every edge carries its provenance — `declared`, `inferred`, `telemetry`, or `knowledge` — and inferred edges carry their evidence. Nothing is magic, and nothing asks you to trust it blindly.

---

## UX Philosophy

### Context Before Action

The first responsibility of the interface is orientation. The app opens onto **Workspace Health** — a workspace-wide rollup — rather than onto a tool.

Within seconds you should understand:

* where you are
* what system you are looking at
* what state it is in
* what has changed
* what requires attention
* what actions are available

A developer should not have to assemble the current state of a project from scattered sources.

### The Control Room, Not the Dashboard

A dashboard answers:

> "What are my metrics?"

A control center answers:

> "What is happening, why does it matter, and what can I do about it?"

Developer Control Center is designed around active understanding and operation. Information should lead naturally to action.

The person this serves best is the on-call engineer at 2am: dark, high-contrast where it matters, no decorative noise, obvious status colors, forgiving of a tired brain.

### Progressive Disclosure

Complex systems contain enormous amounts of information. The interface should not present all of it at once.

Every surface answers "is anything broken?" before it offers detail — glanceable first, drill-down second:

```text
Level 1:
What is happening?

Level 2:
Why is it happening?

Level 3:
Show me the details.

Level 4:
Let me take action.
```

The system reveals complexity only when the developer needs it.

### Reduce Mental Reconstruction

Every feature should answer one question:

> Does this reduce the amount of mental reconstruction a developer must perform?

If it simply displays information already available elsewhere, it is probably not enough. The value comes from connecting information into a coherent understanding of the system.

---

## Core Design Principles

### 1. The Project Should Be Self-Describing

A mature project should be able to explain itself. Developer Control Center provides a home for architecture documentation, environment definitions, operational procedures, development workflows, ownership information, technical decisions, and historical context.

Documents are not a feature bolted onto the side — an ADR, RFC, runbook, or README is a first-class node in the graph, linkable to any service, alongside the runtime state it explains. The goal is to preserve institutional knowledge and make it reachable at the moment it is needed.

### 2. Everything Is Composable

Different situations need different views. The platform does not impose one universal dashboard; it provides composable panels:

```text
Developer Control Center

+-- Workspace Health      +-- Environments
+-- Service Cockpit       +-- Pods & Pod Detail
+-- Repos & PRs           +-- Deploys & Lineage
+-- Workflow Runs         +-- Logs & Log Search
+-- Security Rollup       +-- Health & Metrics
+-- REST / GraphQL        +-- Context
    Explorers             +-- Documents
+-- Dependency Map        +-- Audit Log
```

Panels are arranged into named **layout presets** — "Debugging," "Tech-lead review," "On-call" — so the workspace matches the job in front of you rather than a job title. Panels degrade independently: an unreachable provider turns *its* panels into inline error cards, and the layout stands.

### 3. Everything Is Addressable

Every entity has a stable resource URI:

```text
service://checkout
pod://qa/checkout/checkout-6df4cbf8b
doc://repo-md/checkout-svc/docs/adr/0017-extract-pricing.md
```

If you can see it, you can link to it, jump to it from the command palette, favorite it, and relate it to other things. Navigation history, layout presets, and the graph itself all store URIs — nothing stores ad-hoc object shapes. This is also what makes future extensions cheap: contribute a URI scheme and a panel, and linking, search, and relationships work automatically.

### 4. Connect, Don't Replace

Developer Control Center integrates with existing tools rather than attempting to recreate them.

The goal is not:

> "Another place to do everything."

The goal is:

> "The place where everything makes sense together."

Mechanically, every integration category sits behind a provider interface — Git, deployment, observability, API, artifact, knowledge. GitHub is merely the first `GitProvider` implementation; GitLab becomes an alternate implementation, not a new feature. Providers self-describe their capabilities, and the UI renders only what a provider declares. No capability, no affordance.

### 5. Read-Heavy, Write-Careful

This is primarily an inspection tool. A small set of *safe actions* exists — restart a workload, re-run CI, trigger a deploy — always behind explicit confirmation, always audit-logged to an append-only file you can read. Environments marked `prod-like` require typed-name confirmation. Destructive and irreversible operations are out of scope entirely.

DCC never stores secrets. Config files reference environment variable *names*, never values, and credentials never reach the browser.

---

## Long-Term Vision

Git provides the history of code. Developer Control Center provides **lineage** across the whole system: which pull request produced which build, which build produced which artifact, and which artifact is running in which environment right now.

It connects source code, infrastructure, environments, services, workflows, documentation, decisions, and operational state into a single evolving model of a project. Metrics and logs are always queried live from the systems that own them — DCC composes understanding, it does not become another datastore.

Software systems change constantly. Developer Control Center exists to preserve understanding as they do.

---

## The North Star

A developer should open Developer Control Center and immediately understand:

* the state of the system
* the structure of the system
* the lineage of what is running
* the available actions

without needing to hunt through tools, documents, or tribal knowledge.

That is the mission.

---

## What This Actually Is

A local Next.js application. Concretely:

| Concern | Choice |
| --- | --- |
| Framework | Next.js 15+ (App Router), React 19, TypeScript strict |
| Styling | Tailwind CSS v4 + shadcn/ui, dark-only in v1 |
| Client state | Zustand (layouts, palette, selections, polling toggle) |
| Server-state cache | TanStack Query (polling, retries, stale-while-revalidate) |
| Service layer | Route handlers as a local BFF — credentials stay server-side |
| Runtime | `dcc dev` / `next start -p 7777`, bound to `127.0.0.1` only |

Configuration lives in `dcc.config.json` (overridable via the `DCC_CONFIG` environment variable), validated against a published JSON Schema for editor autocomplete, and editable through a settings UI that writes back to the same file. Invalid config never crashes the app — it boots into a repair screen listing the errors.

No telemetry. No external calls except the upstreams you configure.

## Non-Goals

For v1, DCC is explicitly **not**:

* a CI/CD system, an IaC tool, or a replacement for `kubectl` or Grafana power use
* multi-user — no auth, no RBAC, no hosted deployment
* capable of destructive or irreversible actions (delete namespace, force-push, merge PRs, scale to zero)
* an alerting engine — it *surfaces* alerts; it does not page you
* a metrics or log store — everything is queried live, with only a small local cache

## Roadmap

| Phase | Scope |
| --- | --- |
| **0** | Vertical slice: domain model, URIs, config + inference, GitHub end-to-end, minimal cockpit |
| **1** | Git depth: repo grid, workflow runs, security rollup; repo-markdown knowledge, Context panel |
| **2** | Environments: Kubernetes provider, pods, logs, restart action, derived lineage strip |
| **3** | API Playground: spec ingestion, REST and GraphQL explorers, dependency map |
| **4** | Observability: health board, error and latency panels, log search, deploy markers |
| **5** | Correlation threads and command palette depth |
| **6** | More providers: Vercel, Cloudflare, artifact registries |
| **7** | Polish: full settings CRUD, layout preset UX, audit viewer, keyboard map |

Full scope and exit criteria per phase are in §11 of [the spec](docs/developer-control-center-spec.md).

## Documentation

[docs/developer-control-center-spec.md](docs/developer-control-center-spec.md) is the product and technical specification — domain model, provider interfaces, configuration format, panel library, security model, and phasing. It is frozen at v0.4 and should be treated as the architectural north star rather than a backlog. Its §12 lists twelve open questions still worth answering.

The biggest risk to this project is the spec becoming more sophisticated than the software needs to be. Further sophistication should be earned by the working application, and folded back into the spec only when code proves it.

## License

Apache License 2.0. See [LICENSE](LICENSE).
