"use client";

import {
  Group,
  Panel as ResizablePanel,
  Separator,
} from "react-resizable-panels";

import { listSlots, useUiStore, type LayoutNode } from "@/lib/stores/ui";
import { cn } from "@/lib/utils";

import { Slot } from "./slot";

/**
 * The id of the resizable pane holding a layout node — deliberately not the
 * node's own id.
 *
 * A split node renders two elements: the pane it occupies in its parent group,
 * and the group nested inside that pane. `react-resizable-panels` stamps both
 * `id` and `data-testid` on each, so reusing one id puts two elements in the
 * document under it — enough to break `getElementById`, `getByTestId`, and the
 * `aria-controls` a separator points at its panes with.
 */
function paneId(node: LayoutNode): string {
  return `pane-${node.id}`;
}

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
      defaultLayout={{
        [paneId(left)]: node.sizes[0],
        [paneId(right)]: node.sizes[1],
      }}
      onLayoutChanged={(layout) =>
        setSplitSizes(node.id, [
          layout[paneId(left)] ?? node.sizes[0],
          layout[paneId(right)] ?? node.sizes[1],
        ])
      }
    >
      <ResizablePanel
        id={paneId(left)}
        // A bare number is *pixels* in v4; a percentage has to say so, or a
        // pane drags down to a sliver.
        minSize="15%"
        className="flex min-h-0 min-w-0 flex-col"
      >
        <LayoutTree node={left} />
      </ResizablePanel>
      {/*
       * The divider's thickness runs across the split, so it comes from the
       * group's orientation here rather than from a variant on the separator:
       * the library emits no `data-orientation` at all, and its
       * `aria-orientation` is the separator's own axis — the opposite of the
       * group's — so a variant keyed on that would read backwards.
       */}
      <Separator
        className={cn(
          "bg-border hover:bg-accent data-[separator=active]:bg-accent shrink-0 transition-colors",
          node.orientation === "horizontal" ? "w-1" : "h-1",
        )}
      />
      <ResizablePanel
        id={paneId(right)}
        minSize="15%"
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
