---
name: mermaid-diagrams
description: Use whenever the user asks to create, edit, or visualize a diagram (flowchart, sequence, ER, state, C4, etc.). Produces valid Mermaid syntax, self-checks it, and renders it via Artifact or a committed .mmd file.
---

# Mermaid Diagrams

Claude Code renders Mermaid natively — there is no extension-provided validator or
preview tool here, so this skill is the self-check in place of one.

## Workflow

1. Pick the diagram type (`flowchart`, `sequenceDiagram`, `erDiagram`, `classDiagram`,
   `stateDiagram-v2`, `C4Context`, etc.) and write the Mermaid syntax.
2. Self-check before presenting it — there is no validator tool to call:
   - First line is a valid diagram-type keyword.
   - Arrows match the diagram type (`-->`, `-.->`, `==>` for flowcharts; `->>`, `-->>`
     for sequence diagrams).
   - Brackets/parens opened are closed, node IDs are consistent.
3. Render it:
   - If the user wants to _view_ it, publish via the Artifact tool — Markdown artifacts
     support ` ```mermaid ` fences, HTML artifacts support `<pre class="mermaid">`. No
     external Mermaid script is needed either way.
   - If the user wants a diagram _committed to the repo_, write it to a `.mmd` file at a
     path they'd expect (near the code it documents), not into `docs/design/`
     (including its nested `mockups/`) — that directory is a vendored export (see this
     repo's `CLAUDE.md`) and is never hand-edited.
4. For revisions, edit the Mermaid source directly and re-render — don't hand-tune the
   rendered output.
