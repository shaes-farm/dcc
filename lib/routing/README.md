# `lib/routing`

What a URI opens, and the browser URL that mirrors it (§3.2, §9).

`lib/domain` says what a URI _is_; this says where one _goes_. It imports
`@/lib/domain` and nothing else in the repo — no components, no React outside
`use-uri-navigation.ts` — so the resolver stays testable in a node environment
and a panel id stays something a layout preset can persist.

```text
lib/domain (Uri)  →  lib/routing (panel + params)  →  app/r/[uri]  →  panels
```

## Layout

| File                    | Holds                                                         |
| ----------------------- | ------------------------------------------------------------- |
| `panels.ts`             | `PANEL_IDS` → `PanelId` — the §5.3 panel library              |
| `resolve.ts`            | `resolveUri(uri)` → `Resolution`, the scheme → panel table    |
| `deep-link.ts`          | `deepLinkPath` / `parseDeepLink` — the `/r/…` URL codec       |
| `use-uri-navigation.ts` | `useUriNavigation()` — the only way the UI moves between URIs |
| `index.ts`              | The barrel — import `@/lib/routing`, never a submodule        |

`use-uri-navigation.ts` is the one exception to the barrel rule: it is a client
hook, and re-exporting it would drag `useRouter` into every server component
that only wants `resolveUri`.

## Conventions

- **The resolver is the model; the URL is a mirror.** `resolveUri` decides what
  a URI opens. `deepLinkPath` writes that somewhere the browser can hold it, and
  `parseDeepLink` reads it back. Nothing about routing is decided in the URL, and
  no component should build a `/r/…` path itself — call `navigateToUri`.
- **Resolution is total.** A `Uri` is branded, so it has already been through
  the codec; `resolveUri` cannot fail and returns no `null` for a caller to
  handle. Failure belongs at the edge, where a string becomes a `Uri`.
- **Not every URI opens a panel.** `action://` resolves to
  `{ kind: "action" }` — a §7.1 confirmation dialog. §5.4 is explicit that
  nothing executes from a link or a palette selection without one.
- **Params are the parsed URI.** A panel narrows on `params.scheme` and gets the
  named parts §3.2 defines. Inventing a second parameter shape per panel would
  be a copy of the grammar that drifts.
- **One object, one URL.** `app/r/[uri]` canonicalizes on entry and redirects if
  the address bar disagrees, because history, favorites, and Knowledge Graph keys
  all compare URIs with `===`.
- **Adding a scheme is a type error here.** `SCHEME_PANELS` is keyed by
  `UriScheme`, the same way the codec's `SCHEME_CODECS` is: a new scheme does not
  compile until it names a destination, and `resolve.test.ts` fails until the
  §3.2 fixtures cover it.

## What is not here yet

- **Panels.** `PANEL_IDS` names them; the components arrive with the slot engine
  ([#12](https://github.com/shaes-farm/dcc/issues/12)) and the cockpit
  ([#13](https://github.com/shaes-farm/dcc/issues/13)). `app/r/[uri]` renders the
  resolution itself in the meantime — that view is the seam #12 replaces.
- **`trace-viewer`** has an id and no panel until Phase 4. See
  [ADR-0001](../../docs/adr/adr-0001.md).
- **Paste-to-jump** lives in `components/uri/jump-to-uri.tsx`, a stand-in for the
  palette ([#14](https://github.com/shaes-farm/dcc/issues/14)). #14 deletes it and
  calls `navigateToUriText` instead.
- **Navigation history and favorites.** §3.2 says both store URIs and nothing
  else. Neither exists yet; when they do, they store what `navigateToUri`
  receives.
