# DCC App UI kit

Interactive recreation of the DCC control room, built from the spec's §5 surface mockups (no application code exists in the source repo — surfaces follow the ASCII wireframes and §8 design direction verbatim).

Try it in `index.html`:

- Click a service in the rail → its cockpit (Checkout is fully built).
- ⌘K / Ctrl-K → command palette (fuzzy filter, ↑↓, Enter, Esc).
- Click the crash-looping pod → pod detail drawer.
- "Restart workload" → safe-action confirmation dialog.

Files: `App.jsx` (shell + rail + status bar), `WorkspaceHealth.jsx` (home), `ServiceCockpit.jsx` (lineage strip, panels, Context), `Palette.jsx` (palette + confirm dialog), `PodDrawer.jsx`, `data.js` (sample workspace data from the spec's examples).
