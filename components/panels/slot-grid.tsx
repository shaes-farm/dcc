"use client";

import {
  Group,
  Panel as ResizablePanel,
  Separator,
} from "react-resizable-panels";

import { listSlots, useUiStore, type LayoutNode } from "@/lib/stores/ui";

import { Slot } from "./slot";

function LayoutTree({ node }: { node: LayoutNode }) {
  const setSplitSizes = useUiStore((state) => state.setSplitSizes);

  if (node.type === "slot") {
    return <Slot id={node.id} uri={node.uri} />;
  }

  const [left, right] = node.children;

  return (
    <Group
      id={node.id}
      orientation={node.orientation}
      className="min-h-0 min-w-0 flex-1"
      defaultLayout={{ [left.id]: node.sizes[0], [right.id]: node.sizes[1] }}
      onLayoutChanged={(layout) =>
        setSplitSizes(node.id, [
          layout[left.id] ?? node.sizes[0],
          layout[right.id] ?? node.sizes[1],
        ])
      }
    >
      <ResizablePanel
        id={left.id}
        minSize={15}
        className="flex min-h-0 min-w-0 flex-col"
      >
        <LayoutTree node={left} />
      </ResizablePanel>
      <Separator className="bg-border hover:bg-accent shrink-0 transition-colors data-[orientation=horizontal]:w-1 data-[orientation=vertical]:h-1" />
      <ResizablePanel
        id={right.id}
        minSize={15}
        className="flex min-h-0 min-w-0 flex-col"
      >
        <LayoutTree node={right} />
      </ResizablePanel>
    </Group>
  );
}

/**
 * The slot engine's grid (spec §5.3, issue #12): a slot-based CSS grid, not
 * free-form docking — split, resize, swap, and maximize panels within preset
 * slots. `react-resizable-panels` owns divider drag and size persistence
 * within a group; split/swap/maximize are this codebase's own, kept in
 * `lib/stores/ui.ts` as URIs and panel ids only (§3.2).
 */
export function SlotGrid() {
  const layout = useUiStore((state) => state.layout);
  const maximizedSlotId = useUiStore((state) => state.maximizedSlotId);

  const maximizedSlot = maximizedSlotId
    ? listSlots(layout).find((slot) => slot.id === maximizedSlotId)
    : undefined;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 p-2">
      {maximizedSlot ? (
        <Slot id={maximizedSlot.id} uri={maximizedSlot.uri} />
      ) : (
        <LayoutTree node={layout} />
      )}
    </div>
  );
}
