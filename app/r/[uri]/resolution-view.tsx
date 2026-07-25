"use client";

import { useEffect } from "react";

import { SlotGrid } from "@/components/panels/slot-grid";
import { Addressable } from "@/components/uri/addressable";
import { UriChip } from "@/components/uri/uri-chip";
import type { Resolution } from "@/lib/routing";
import { useUiStore } from "@/lib/stores/ui";

/**
 * What a URI resolved to — the slot engine's grid for `kind: "panel"`.
 *
 * A deep link opens its object into the grid's primary slot rather than
 * replacing the whole layout, so split/resize/swap/maximize survive
 * navigating between objects. `action://` URIs never mount a panel (§7.1) —
 * that case keeps the resolution-dump view a panel grid has no use for.
 */
export function ResolutionView({ resolution }: { resolution: Resolution }) {
  const seedPrimarySlot = useUiStore((state) => state.seedPrimarySlot);

  useEffect(() => {
    if (resolution.kind === "panel") seedPrimarySlot(resolution.uri);
  }, [resolution, seedPrimarySlot]);

  if (resolution.kind === "panel") return <SlotGrid />;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-16">
      <div className="flex flex-col gap-2">
        <span className="text-xs tracking-wide text-muted-foreground uppercase">
          Action
        </span>
        <Addressable uri={resolution.uri}>
          <UriChip uri={resolution.uri} />
        </Addressable>
      </div>

      <Rows
        rows={[
          ["action", resolution.actionId],
          ["target", resolution.target],
        ]}
      />

      <p className="max-w-prose text-sm text-muted-foreground">
        Actions open a confirmation dialog, never a view — nothing runs straight
        off a link (§7.1).
      </p>
    </main>
  );
}

function Rows({ rows }: { rows: Array<[label: string, value: string]> }) {
  return (
    <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 border-t border-border pt-4 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="font-mono text-xs text-muted-foreground">{label}</dt>
          <dd className="font-mono text-xs break-all">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
