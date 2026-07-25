import type { ReactNode } from "react";

import type { Uri } from "@/lib/domain";
import { resolveUri } from "@/lib/routing";

import { PANEL_REGISTRY, UnimplementedPanel } from "./registry";

/**
 * Mounts a panel from a `Resolution` alone (spec §3.2, issue #12) — the only
 * inputs are the URI itself and slot chrome, never provider data or
 * callbacks passed down from a parent that resolved something on the panel's
 * behalf.
 */
export function PanelMount({
  uri,
  actions,
}: {
  uri: Uri;
  actions?: ReactNode;
}) {
  const resolution = resolveUri(uri);

  // §7.1: actions open a confirmation dialog, never a panel — a slot never
  // holds one. Nothing routes an `action://` URI into a slot today, but the
  // check keeps this total rather than trusting every future caller to know
  // that.
  if (resolution.kind === "action") return null;

  const Component = PANEL_REGISTRY[resolution.panel] ?? UnimplementedPanel;
  return (
    <Component
      uri={resolution.uri}
      params={resolution.params}
      actions={actions}
    />
  );
}
