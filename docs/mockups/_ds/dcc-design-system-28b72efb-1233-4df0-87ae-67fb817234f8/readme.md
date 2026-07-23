# DCC — Developer Control Center Design System

Design system for **Developer Control Center (DCC)**: a local-only, dark, keyboard-driven "IDE for distributed systems" that consolidates GitHub, Kubernetes/hosting, API docs, and observability into one control room. The Service is the unit of thought; the app is organized as dockable panels around a Knowledge Graph. Built for the on-call engineer at 2am.

## Sources
- GitHub: https://github.com/shaes-farm/dcc — README + `docs/developer-control-center-spec.md` (spec v0.4, frozen). **The repo contains no application code, no logo, no fonts, and no existing UI** — this system was authored from the spec's §8 "UX & Design Direction" and its ASCII surface mockups. Explore the repo (especially the spec) to design deeper surfaces faithfully.

## Product
One product/surface: the DCC app itself (localhost:7777, dark-only v1). Key surfaces: Workspace Health (home), service left rail + status dots, Service Cockpit with Lineage strip, panel grid with layout presets, command palette (⌘K), Context panel/drawers, workspace status bar.

## CONTENT FUNDAMENTALS
- **Tone:** calm, factual, terse. States facts, then offers action. No marketing voice, no exclamation, never cute. "The app tells a story, not isolated facts."
- **Casing:** Sentence case everywhere ("Attention needed", "Restart workload"). Panel titles sentence case. Identifiers, URIs, SHAs, versions verbatim in monospace (`checkout-6df4cbf8b`, `sha256:4bf9…`, `service://checkout`).
- **Actions are verb-first imperatives:** "Restart workload", "Re-run failed checks", "Trigger deploy", "Open in Grafana", "Copy as curl".
- **Numbers lead rollups:** "18 services · 3 unhealthy", "147 pods · 98% healthy", "11 security alerts (2 critical)". Middle-dot `·` separates facts.
- **Timestamps:** 24h clock ("14:32"), relative freshness ("as of 12s ago", "merged 2h"). Every panel shows data age — trust at 2am.
- **Errors are actionable:** "401 from Grafana — check GRAFANA_TOKEN in your shell". Empty states point to the fix: "No services configured → Add in Settings".
- **No emoji.** Unicode status glyphs only, always paired with color: ✓ ⚠ ⛔ ● ▶ ⏳ →.
- **Person:** the app addresses the engineer as "you" sparingly; mostly it describes the system. Confirmation dialogs state exactly what will happen and against what.

## VISUAL FOUNDATIONS
- **Theme:** dark-only. Near-black layered backgrounds (never pure #000): `--bg-0` #0A0D12 canvas → `--bg-1` panels → `--bg-2` raised → `--bg-3` hover/inputs. Depth by background step + 1px border, not shadow.
- **One accent:** cyan `--accent` #34C6EC — links, focus rings, primary buttons, selection. Status colors are the ONLY other saturated colors: green healthy / amber degraded / red failing / blue deploying / gray unknown. Colorblind-safe: color always paired with a glyph, never color alone.
- **Type:** IBM Plex Sans (clean grotesque) for UI chrome; JetBrains Mono for identifiers, URIs, logs, JSON, timestamps, versions. Base UI size 13px; dense but calm. Both loaded from Google Fonts (see caveat in Fonts).
- **Density:** information-dense but calm. Tables over cards where data is comparable. Generous line-height (1.7) in logs. 4px spacing scale.
- **Layout:** left rail (services, status-dotted, 240px) · panel grid content area · right-side drawers (420px) for detail so context is never lost · persistent bottom status bar (28px).
- **Cards/panels:** `--bg-1` fill, 1px `--border-1`, 6px radius, 34px header row (title left, "as of Xs" + actions right). No outer shadows except drawers/dialogs/palette (`--shadow-overlay`).
- **Borders:** 1px hairlines do all separation. `--border-1` #1E2733 default, `--border-2` #2C3949 hover/emphasis.
- **Radii:** 4px controls, 6px panels/cards, 8px dialogs/palette. Status dots are circles; tags are 4px, never pills except status badges (999px).
- **Motion:** minimal. 120–160ms ease-out state transitions (status color fades, drawer slide, panel swap). No skeleton shimmer — show stale data with its timestamp instead of spinners.
- **Hover:** background steps up one level (`--bg-2`→`--bg-3`) or border brightens; text-2 → text-1. **Press:** background darkens slightly; no shrink/scale.
- **Focus:** 2px `--accent` ring at 40% opacity, offset 1px. Keyboard-first app — focus states are first-class.
- **Imagery:** none. No photos, illustrations, or gradients. Data is the decoration. Charts use accent + status colors only, thin 1.5px strokes.
- **Transparency/blur:** only overlay scrims (rgba(4,7,10,.6)) behind palette/dialogs; optional subtle blur on scrim. Panels are opaque.
- **Logo:** none exists. Render "DCC" (or "Developer Control Center") in JetBrains Mono 600 wherever a mark would go. Do not invent a mark.

## ICONOGRAPHY
- No icon assets exist in the source. Two-tier approach:
  1. **Unicode status glyphs** (from the spec's own mockups) for status/inline text: ✓ ⚠ ⛔ ● ○ ▶ ⏳ ⏪ ⚡ → ↑ ↓ ⌘. Always monospace, always paired with status color.
  2. **Lucide icons** (stroke 1.5–1.75, 14–16px) for chrome: matches the shadcn/ui stack the spec mandates. Load from CDN (`lucide` UMD) — **substitution, flagged**: the source defines no icon set.
- No icon font, no emoji, no custom SVG drawings.

## Fonts (CAVEAT — substitutions)
Spec asks for "JetBrains Mono or similar" + "a clean grotesque" but ships no font files. Substituted from Google Fonts: **JetBrains Mono** (named in spec) and **IBM Plex Sans** (grotesque). Loaded via `@import` in `tokens/fonts.css`. Provide licensed font files to replace.

## Index
- `styles.css` — global entry; imports everything under `tokens/`.
- `tokens/` — `fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `effects.css`.
- `components/core/` — Button, IconButton, Input, Select, Checkbox, Switch.
- `components/status/` — StatusDot, StatusBadge, Tag, UriChip.
- `components/panels/` — Panel, EmptyState, ErrorCard, StatusBar.
- `ui_kits/dcc-app/` — interactive recreation: Workspace Health home, service rail, Checkout cockpit with lineage strip, command palette. `index.html` is click-through.
- `guidelines/` — foundation specimen cards (Design System tab).
- `SKILL.md` — agent skill entry point.

## Intentional additions
- **UriChip** — monospace URI pill; URIs are a first-class spec concept (§3.2) that needs a consistent rendering.
- **StatusBar** — the persistent bottom bar is a named spec surface (§7.2).
- Standard form controls (Button, Input, …) authored per shadcn/ui-on-dark conventions since the spec mandates that stack but ships no components.
