import {
  parseUri,
  type ParsedUri,
  type ParsedUriOf,
  type Uri,
  type UriScheme,
} from "@/lib/domain";

import type { PanelId } from "./panels";

/**
 * The URI → panel resolver (spec §3.2, §9).
 *
 * §3.2 promises that "the internal router resolves `URI → panel +
 * parameters`". This is that router. It is the only place that knows which
 * scheme opens which panel, which is what lets a plugin later contribute a
 * scheme and a panel and get linking, palette entry, and deep links for free.
 *
 * The URL is a mirror of this, not the other way around: `deep-link.ts` writes
 * a resolution into the address bar and reads one back, but nothing about
 * routing is decided there.
 */

/**
 * What a URI opens.
 *
 * Not every URI opens a panel. `action://restartWorkload?target=…` is a §7.1
 * confirmation dialog — §5.4 is explicit that nothing executes without one —
 * so modelling every resolution as a panel would leave the action case to be
 * special-cased by every caller, or worse, missed by one.
 */
export type Resolution =
  | {
      kind: "panel";
      panel: PanelId;
      uri: Uri;
      /**
       * The URI's own named parts, straight from the codec.
       *
       * Deliberately not a second parameter vocabulary: a panel narrows on
       * `params.scheme` and gets exactly the fields §3.2 defines, already
       * validated. Anything else would be a shape to keep in sync with the
       * grammar.
       */
      params: ParsedUri;
    }
  | {
      kind: "action";
      uri: Uri;
      /** The action to confirm, e.g. `restartWorkload`. */
      actionId: string;
      /** What it acts on. Resolvable in its own right — §7.1 dialogs render it. */
      target: Uri;
    };

/**
 * Which panel a scheme opens.
 *
 * A rule is a panel id, or a function when the URI's own parts decide — see
 * `api` and `op`. Keyed by scheme minus `action`, so the one scheme that
 * resolves to something other than a panel is excluded in the type rather than
 * remembered by a reader, and a scheme added to `URI_SCHEMES` without a
 * destination is a type error rather than a runtime surprise.
 */
type PanelRule<S extends UriScheme> =
  PanelId | ((parsed: ParsedUriOf<S>) => PanelId);

const SCHEME_PANELS: {
  [S in Exclude<UriScheme, "action">]: PanelRule<S>;
} = {
  workspace: "workspace-health",

  /**
   * §5.2's cockpit is a preset *layout* of panels bound to one service, not a
   * single panel. Resolution names the destination; what it arranges is
   * https://github.com/shaes-farm/dcc/issues/13. Nobody should go looking for
   * a `ServiceCockpitPanel`.
   */
  service: "service-cockpit",

  repo: "repos",
  pr: "prs",
  run: "workflow-runs",
  artifact: "artifacts",
  alert: "security",
  env: "environments",
  deploy: "deploys",

  /**
   * A workload has no panel of its own in §5.3's library — the Pods panel is
   * what renders one, scoped by `params`. The alternative was inventing a
   * panel the spec does not list.
   */
  workload: "pods",

  pod: "pod-detail",

  /**
   * The only mapping that is not one scheme, one panel: §5.3 ships the REST
   * and GraphQL explorers as separate panels, so the URI's `ApiKind` picks
   * between them. Adding a kind to `API_KINDS` fails to compile here, which is
   * the intent — a third API kind needs a panel decision, not a default.
   */
  api: ({ kind }) => (kind === "rest" ? "rest-explorer" : "graphql-explorer"),
  op: ({ apiKind }) =>
    apiKind === "rest" ? "rest-explorer" : "graphql-explorer",

  dashboard: "pinned-dashboard",
  doc: "document-viewer",
  logs: "logs",

  /** ADR-0001 — the panel itself is Phase 4 (§6.4). */
  trace: "trace-viewer",
};

/**
 * Resolves a URI to what it opens.
 *
 * Total: a `Uri` is branded, so it has already been through the codec and
 * every scheme has a destination. There is no failure case and no `null` for a
 * caller to handle — an unresolvable URI is caught at the edge, where a string
 * becomes a `Uri` (`toUri`, `safeParseUri`), not here.
 */
export function resolveUri(uri: Uri): Resolution {
  // Cannot throw: `formatUri` reads every URI back before branding it, so a
  // value of type `Uri` is one the parser has already accepted.
  const parsed = parseUri(uri);

  if (parsed.scheme === "action") {
    return {
      kind: "action",
      uri,
      actionId: parsed.id,
      target: parsed.target,
    };
  }

  const rule = SCHEME_PANELS[parsed.scheme];
  return {
    kind: "panel",
    // The record is keyed by scheme and `parsed` is discriminated on it, but
    // TypeScript cannot correlate the two across an index access — the same
    // limitation `formatUri` works around in lib/domain/uri.ts.
    panel: typeof rule === "function" ? rule(parsed as never) : rule,
    uri,
    params: parsed,
  };
}
