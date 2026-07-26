import type { ComponentType, ReactNode } from "react";

import { EmptyState } from "@/components/ds/empty-state";
import { Panel } from "@/components/ds/panel";
import type { ParsedUri, Uri } from "@/lib/domain";
import type { PanelId } from "@/lib/routing";

import { EnvironmentsPanel } from "./fixtures/environments-panel";
import { PrsPanel } from "./git/prs-panel";
import { ReposPanel } from "./git/repos-panel";
import { SecurityPanel } from "./git/security-panel";

/**
 * What every panel receives, and nothing else (issue #12's "no props threaded
 * through"): the URI it was resolved from and the codec's own parsed parts.
 * `actions` is slot chrome, not panel data — the split/swap/maximize controls
 * a `Slot` injects into the header it renders, same as the mockups' own
 * Refresh/Pause-tail header buttons.
 */
export interface PanelComponentProps {
  uri: Uri;
  params: ParsedUri;
  actions?: ReactNode;
}

/**
 * `PanelId` → the component that renders it.
 *
 * The three git panels read live GitHub data through `/api/git/*` (#11);
 * `environments` is still a fixture until the `DeploymentProvider` lands (#10).
 * Everything else in §5.3's library falls back to `UnimplementedPanel` below,
 * so a slot mounting any panel id stays total the same way `resolveUri` is:
 * nothing this ships owes a `PanelId` a component before the issue that
 * actually builds it lands.
 */
export const PANEL_REGISTRY: Partial<
  Record<PanelId, ComponentType<PanelComponentProps>>
> = {
  repos: ReposPanel,
  prs: PrsPanel,
  environments: EnvironmentsPanel,
  security: SecurityPanel,
};

/**
 * The fallback for every `PanelId` not yet in `PANEL_REGISTRY`. Exported
 * (rather than folded into a lookup function) so a caller resolves a panel
 * component with a plain property access — `PANEL_REGISTRY[id] ??
 * UnimplementedPanel` — and not a function call, which is what lets that
 * result be used directly as a JSX tag.
 */
export function UnimplementedPanel({ uri, actions }: PanelComponentProps) {
  return (
    <Panel title={uri} actions={actions}>
      <EmptyState
        message="No panel for this URI yet"
        action={
          <span className="text-faint text-sm">
            Built when the issue that owns it lands.
          </span>
        }
      />
    </Panel>
  );
}
