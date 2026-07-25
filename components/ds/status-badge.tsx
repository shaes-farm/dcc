import type { Status } from "@/lib/domain";
import { cn } from "@/lib/utils";

import { STATUS_VISUALS } from "./status-visuals";

/**
 * Glyph + label status pill — table cells, panel headers, rollups
 * (`docs/design/components/status/StatusBadge.prompt.md`). The only
 * pill-shaped element in DCC.
 *
 * The glyph is not decoration: it is what keeps the five statuses apart in
 * grayscale, or for a reader who cannot separate the greens from the reds
 * (§8). It renders whether or not a label is supplied.
 */
export function StatusBadge({
  status,
  children,
  className,
}: {
  status: Status;
  /**
   * Label override — the upstream detail worth showing, e.g.
   * `CrashLoopBackOff` or `2 critical`. Defaults to the status word.
   */
  children?: React.ReactNode;
  className?: string;
}) {
  const visual = STATUS_VISUALS[status];

  return (
    <span
      className={cn(
        "inline-flex h-4.5 items-center gap-1.25 rounded-full px-2 font-mono text-xs leading-none font-medium whitespace-nowrap",
        visual.dim,
        visual.text,
        className,
      )}
    >
      {/* Hidden from screen readers: the label beside it already says it. */}
      <span aria-hidden="true">{visual.glyph}</span>
      {children ?? status}
    </span>
  );
}
