import { cn } from "@/lib/utils";

/**
 * The panel — DCC's universal container (spec §5.3,
 * `docs/design/components/panels/Panel.prompt.md`). Every capability ships as
 * a panel in a grid slot; nothing downstream draws one freehand.
 *
 * The header is not decoration either. §2.1 makes data freshness a first-class
 * property of every surface, so `asOf` is where a panel says how old what it
 * is showing is — "prefer stale-data-with-timestamp over spinners" (§8).
 *
 * The slot engine (https://github.com/shaes-farm/dcc/issues/12) arranges these;
 * this is only the shell.
 */
export function Panel({
  title,
  asOf,
  actions,
  pad = true,
  className,
  children,
}: {
  title: React.ReactNode;
  /** Data age, e.g. `8s ago`. Rendered as "as of 8s ago". */
  asOf?: string;
  /** Header-right nodes — icon buttons, a select. */
  actions?: React.ReactNode;
  /** `false` for tables and logs that go edge-to-edge. */
  pad?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "border-hairline bg-panel flex min-w-0 flex-col overflow-hidden rounded-md border",
        className,
      )}
    >
      <header className="border-hairline h-panel-header flex shrink-0 items-center gap-2 border-b px-2.5">
        <span className="text-body truncate text-base font-semibold">
          {title}
        </span>
        <span className="flex-1" />
        {asOf ? (
          <span className="text-faint font-mono text-2xs whitespace-nowrap">
            as of {asOf}
          </span>
        ) : null}
        {actions}
      </header>

      <div className={cn("min-h-0 flex-1 overflow-auto", pad && "p-2.5")}>
        {children}
      </div>
    </section>
  );
}
