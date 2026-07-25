import { cn } from "@/lib/utils";

import { StatusDot } from "./status-dot";
import { STATUS_VISUALS } from "./status-visuals";

/**
 * The persistent workspace status bar (spec §7.2,
 * `docs/design/components/panels/StatusBar.prompt.md`) — 28px, always at the
 * bottom, never scrolled away.
 *
 * §7.2's contents: the workspace, the active layout preset, whether polling is
 * running, a "system OK / N issues" beacon, and a 24h clock. The preset and
 * the issue count are placeholders until the slot engine
 * (https://github.com/shaes-farm/dcc/issues/12) and the health rollup
 * (https://github.com/shaes-farm/dcc/issues/11) can supply real ones.
 */
export function StatusBar({
  workspace,
  preset,
  polling = false,
  issues,
  clock,
  className,
}: {
  workspace: string;
  preset?: string;
  polling?: boolean;
  /**
   * `0` renders "✓ system OK"; omitting it renders "○ health unknown".
   *
   * The design system's own contract stops at "0 renders ✓ system OK", which
   * assumes a rollup has actually run. Absent one, §2.2's rule applies —
   * missing data is `unknown`, never a guessed `healthy` — so "no issues
   * counted yet" and "counted, found none" cannot collapse into the same
   * green checkmark.
   */
  issues?: number;
  /**
   * Widened from the design system's `string` to a node: a live clock cannot
   * be a server-rendered string without freezing or mismatching on hydration,
   * so callers pass `<StatusBarClock />` (or a fixed string, in tests).
   */
  clock?: React.ReactNode;
  className?: string;
}) {
  const beacon =
    issues === undefined
      ? { status: "unknown" as const, label: "health unknown" }
      : issues === 0
        ? { status: "healthy" as const, label: "system OK" }
        : { status: "degraded" as const, label: `${issues} issues` };

  return (
    <footer
      className={cn(
        "border-hairline bg-panel h-statusbar text-label box-border flex shrink-0 items-center gap-3.5 border-t px-3 font-mono text-xs",
        className,
      )}
    >
      <span className="text-body font-semibold">{workspace}</span>
      {preset ? <span className="text-faint">layout: {preset}</span> : null}

      <span className="inline-flex items-center gap-1.25">
        <StatusDot status={polling ? "healthy" : "unknown"} size={6} />
        polling {polling ? "on" : "paused"}
      </span>

      <span className="flex-1" />

      <span
        className={cn(
          "inline-flex items-center gap-1.25",
          STATUS_VISUALS[beacon.status].text,
        )}
      >
        <span aria-hidden="true">{STATUS_VISUALS[beacon.status].glyph}</span>
        {beacon.label}
      </span>

      {clock ? <span className="text-faint">{clock}</span> : null}
    </footer>
  );
}
