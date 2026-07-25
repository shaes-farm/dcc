import Link from "next/link";

import { StatusDot } from "@/components/ds/status-dot";
import { Tag } from "@/components/ds/tag";
import { EmptyState } from "@/components/ds/empty-state";
import { Addressable } from "@/components/uri/addressable";
import type { DccConfig } from "@/lib/config/schema";

import { serviceRailRows } from "./rail-rows";

/**
 * The service left rail (spec §5.2, §8), drawn from
 * `docs/design/mockups/DCCRail.dc.html`.
 *
 * §8's layout rule: "left rail = services (status-dotted) with capability
 * lenses beneath". Services come straight from `dcc.config.json` — no provider
 * and no graph is involved, which is why this is the first surface Phase 0
 * builds.
 *
 * Takes `config` as a prop and never loads it: `app/layout.tsx` is the one
 * place that touches the filesystem, which also keeps this a plain synchronous
 * component that renders in a test without a server runtime.
 */
export function ServiceRail({ config }: { config: DccConfig }) {
  const rows = serviceRailRows(config);

  return (
    <nav
      aria-label="Services"
      className="border-hairline bg-panel w-rail flex shrink-0 flex-col overflow-auto border-r"
    >
      <div className="border-hairline flex items-center gap-2 border-b p-3">
        <span className="font-mono text-[15px] font-bold tracking-[-0.02em]">
          DC<span className="text-accent-strong">C</span>
        </span>
        <span className="text-label flex-1 truncate text-sm">
          {config.workspace.name}
        </span>
        {/* Workspace rollup. `unknown` until there is health to roll up (#11). */}
        <StatusDot status="unknown" />
      </div>

      {/*
       * The palette's own trigger (§5.4) is
       * https://github.com/shaes-farm/dcc/issues/14. The affordance is drawn
       * here because the rail's proportions depend on it, but ⌘K does nothing
       * yet — a disabled button rather than one that silently fails.
       */}
      <div
        aria-hidden="true"
        className="border-hairline bg-inset text-faint m-2.5 flex h-6.5 items-center gap-2 rounded-sm border px-2 text-sm"
      >
        <span>Jump to…</span>
        <span className="flex-1" />
        <kbd className="border-hairline-strong bg-raised rounded-[3px] border px-1 font-mono text-2xs">
          ⌘K
        </kbd>
      </div>

      {/*
       * Workspace Health is the home screen (§5.1), so this points at `/`
       * rather than at a `workspace://` deep link. What identity a workspace
       * URI carries — `workspace.name` is "Acme Commerce", while §3.2's
       * example is the slug `workspace://commerce` — is the inference
       * resolver's call (https://github.com/shaes-farm/dcc/issues/9), and
       * guessing it here would spread the guess.
       */}
      <Link
        href="/"
        className="text-label hover:bg-raised hover:text-body flex items-center gap-2 border-l-2 border-transparent px-3 py-1 text-base"
      >
        <span aria-hidden="true" className="w-2 text-center">
          ◉
        </span>
        Workspace Health
      </Link>

      <RailSection label="Services" />

      {rows.length > 0 ? (
        <ul>
          {rows.map((row) => (
            <li key={row.uri}>
              {/*
               * `Addressable` is the row's link, not a wrapper around one: it
               * already renders `role="link"` with the URI as its accessible
               * name and opens the URI on click, so nesting a `next/link`
               * inside would put two link roles on one row and an anchor
               * inside an interactive span. Copy-link and the keyboard path
               * come with it (§3.2).
               */}
              <Addressable
                uri={row.uri}
                className="text-label hover:bg-raised hover:text-body flex w-full items-center gap-2 border-l-2 border-transparent px-3 py-1 text-base"
              >
                <StatusDot status={row.status} size={6} />
                <span className="flex-1 truncate" title={row.uri}>
                  {row.label}
                </span>
              </Addressable>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          className="px-3 py-4"
          message={
            <>
              No services configured
              <br />
              <code className="font-mono text-xs">dcc.config.json</code>
            </>
          }
        />
      )}

      <RailSection label="Lenses" />

      {/*
       * §5.2's tool-centric lenses: "the same panels bound to workspace scope
       * instead of a service". They are drawn but inert — the panels they name
       * arrive with the slot engine and the cockpit
       * (https://github.com/shaes-farm/dcc/issues/12,
       * https://github.com/shaes-farm/dcc/issues/13), and a link to a panel
       * that does not exist is worse than a label that does not move.
       */}
      <ul aria-hidden="true">
        {LENSES.map((lens) => (
          <li
            key={lens}
            className="text-faint flex items-center gap-2 px-3 py-1"
          >
            <span className="w-2" />
            <span className="text-sm">{lens}</span>
          </li>
        ))}
      </ul>

      <div className="flex-1" />

      {/* Layout presets (§5.3), switchable once the slot engine owns them (#12). */}
      <div
        aria-hidden="true"
        className="border-hairline flex flex-wrap gap-1.5 border-t p-3"
      >
        <Tag accent>On-call</Tag>
        <Tag>Debugging</Tag>
        <Tag>Tech-lead</Tag>
      </div>
    </nav>
  );
}

/** §5.2's tool-centric lenses, in the mockup's order. */
const LENSES = [
  "Repos & PRs",
  "Workflow runs",
  "Security",
  "Environments",
  "Observability",
  "APIs",
  "Documents",
  "Audit log",
] as const;

function RailSection({ label }: { label: string }) {
  return (
    <div className="text-faint text-2xs tracking-overline px-3 pt-3 pb-1 font-medium uppercase">
      {label}
    </div>
  );
}
