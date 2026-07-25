import { Panel } from "@/components/ds/panel";
import { EmptyState } from "@/components/ds/empty-state";
import { JumpToUri } from "@/components/uri/jump-to-uri";

/**
 * Workspace Health — the home screen (spec §5.1).
 *
 * A panel shell with nothing in it yet: the rollup it exists to show needs
 * providers reporting (https://github.com/shaes-farm/dcc/issues/11) and the
 * grid it will sit in is the slot engine's
 * (https://github.com/shaes-farm/dcc/issues/12). What this issue owns is the
 * frame around it.
 */
export default function Home() {
  return (
    <div className="flex flex-1 flex-col gap-3 p-4">
      <Panel title="Workspace Health">
        <EmptyState
          message="Nothing to report yet — no provider is connected."
          action={
            <span className="text-faint text-sm">
              Services are listed in the rail from{" "}
              <code className="font-mono text-xs">dcc.config.json</code>.
            </span>
          }
        />
      </Panel>

      {/* Stands in for the palette's "paste a URI to jump" (§5.4) until #14. */}
      <Panel title="Jump to a URI">
        <JumpToUri />
      </Panel>
    </div>
  );
}
