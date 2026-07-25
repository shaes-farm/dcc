import type { Status } from "@/lib/domain";
import { cn } from "@/lib/utils";

import { STATUS_VISUALS } from "./status-visuals";

/**
 * Rolled-up status dot — service rail, environment rows, workspace beacon
 * (`docs/design/components/status/StatusDot.prompt.md`).
 *
 * The dot is color-only by design, so it carries its status as an accessible
 * name and a tooltip; §8's "never color alone" is satisfied by the label, and
 * by `StatusBadge` wherever the status needs to survive a grayscale glance.
 */
export function StatusDot({
  status,
  size = 8,
  pulse,
  className,
}: {
  status: Status;
  /**
   * Diameter in px. The kit documents three sizes and no others — 8 default,
   * 6 inline, 10 in headers — so this is a union rather than `number`: a
   * Tailwind class has to exist for each, and an arbitrary width would
   * compile to nothing.
   */
  size?: 6 | 8 | 10;
  /** Slow opacity pulse. Ignored unless the status is `deploying`. */
  pulse?: boolean;
  className?: string;
}) {
  const sizes = { 6: "size-1.5", 8: "size-2", 10: "size-2.5" } as const;

  return (
    <span
      aria-label={status}
      title={status}
      className={cn(
        "inline-block shrink-0 rounded-full",
        sizes[size],
        STATUS_VISUALS[status].dot,
        pulse && status === "deploying" && "animate-status-pulse",
        className,
      )}
    />
  );
}
