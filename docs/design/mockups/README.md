# Mockups

Hi-fi mockups of the DCC surfaces, built from the design system in the parent
`docs/design/` directory.

- **`DCC Mockups.dc.html`** — four surfaces (Checkout Service · Deploys, Logs,
  Knowledge graph, Settings), each with the left rail as chrome.
- **`DCCRail.dc.html`** — the navigation rail, imported by the four surfaces via
  `<dc-import name="DCCRail" …>`.

## Viewing them

**Serve over HTTP — do not open the files directly (`file://`).** The runtime
loads sibling components (the rail) with `fetch()`, which browsers block on
`file://`, so the rail renders as an empty placeholder when you double-click the
file.

**Serve from `docs/design/`, not from this folder.** The mockups reference the
design system one level up (`../tokens/*.css`, `../styles.css`, `../_ds_bundle.js`),
and a static server won't serve files above its root — serving from `mockups/`
404s the design system. `docs/design/` is the tightest root that resolves both the
`../` refs and the `./DCCRail.dc.html` sibling:

```sh
cd docs/design && python3 -m http.server 8080
# then open http://localhost:8080/mockups/DCC%20Mockups.dc.html
```

Serving from the repo root works too, at
`http://localhost:8080/docs/design/mockups/DCC%20Mockups.dc.html`.
