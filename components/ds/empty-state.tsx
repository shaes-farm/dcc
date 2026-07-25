import { cn } from "@/lib/utils";

/**
 * A panel's empty state (spec §8,
 * `docs/design/components/panels/EmptyState.prompt.md`).
 *
 * §8 asks every panel for a designed empty state, and gives the shape of one:
 * "No services configured → Add in Settings". The message names what is
 * missing and the action points at where to fix it — never a bare "nothing
 * here", which tells a reader nothing they did not already know.
 */
export function EmptyState({
  message,
  action,
  className,
}: {
  message: React.ReactNode;
  /** The fix — a button, a link to the settings section that owns it. */
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2.5 px-4 py-7 text-center",
        className,
      )}
    >
      <span className="text-faint text-base">{message}</span>
      {action ? <span className="inline-flex">{action}</span> : null}
    </div>
  );
}
