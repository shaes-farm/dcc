import { cn } from "@/lib/utils";

import { STATUS_VISUALS } from "./status-visuals";

/**
 * A panel's degraded state (spec §5.3, §8,
 * `docs/design/components/panels/ErrorCard.prompt.md`).
 *
 * §5.3: "panels degrade independently — an unreachable provider turns *its*
 * panels into inline error cards; the layout stands." This is that card, which
 * is why it is an inline block inside a `Panel` and never a full-screen state.
 *
 * `detail` must be actionable. The bar the design system sets is a Grafana 401
 * that names the env var to fix — "401 from Grafana — check GRAFANA_TOKEN in
 * your shell" — not "request failed".
 */
export function ErrorCard({
  title = "Provider unreachable",
  detail,
  action,
  className,
}: {
  title?: React.ReactNode;
  /** Actionable mono detail: what broke, and what to change to fix it. */
  detail?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-status-failing/30 bg-status-failing-dim flex flex-col gap-1.5 rounded-md border px-3.5 py-3",
        className,
      )}
    >
      <div className="text-status-failing flex items-center gap-2 text-base font-semibold">
        <span aria-hidden="true">{STATUS_VISUALS.failing.glyph}</span>
        {title}
      </div>

      {detail ? (
        <div className="text-label font-mono text-sm leading-normal">
          {detail}
        </div>
      ) : null}

      {action ? <div className="mt-0.5">{action}</div> : null}
    </div>
  );
}
