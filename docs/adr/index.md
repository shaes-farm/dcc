# Architecture Decision Records

`docs/ARCHITECTURE.md` is frozen at v0.4 and is not edited. Decisions that
extend, correct, or supersede it are recorded here instead, one file each, so
that every change to the architecture after the freeze is reviewable on its own
and discoverable in one list.

Write one when a decision changes what the spec says, fills a gap the spec left,
or picks between options the spec left open — not for ordinary implementation
choices, which belong in the code and its comments. Copy
[adr-0000.md](adr-0000.md), fill it in, add a row below, and cite the ADR number
alongside the § number in code comments, commit messages, and PR bodies.

Numbering is sequential and permanent. An ADR is never deleted or rewritten; a
decision that no longer holds gets a new ADR, and the old one's status becomes
`superseded by ADR-NNNN`.

| ADR                 | Title                                     | Date       | Status   | Summary                                                                                 |
| ------------------- | ----------------------------------------- | ---------- | -------- | --------------------------------------------------------------------------------------- |
| [0000](adr-0000.md) | Template                                  | —          | —        | The shape of an ADR. Not a decision.                                                    |
| [0001](adr-0001.md) | Trace viewer joins the §5.3 panel library | 2026-07-22 | accepted | §3.2 defines `trace://` but §5.3 listed no panel to resolve it to; adds `trace-viewer`. |
