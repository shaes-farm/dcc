import { create } from "zustand";

import { toUri, type Uri } from "@/lib/domain";

/**
 * Client/UI state (spec §9) — things the browser owns and the server never
 * needs to know about. Server state belongs in TanStack Query instead; see
 * app/providers.tsx.
 */
interface UiState {
  /** Whether the right-hand context drawer is open (§5.5). */
  contextPanelOpen: boolean;
  setContextPanelOpen: (open: boolean) => void;
  toggleContextPanel: () => void;

  /** The slot engine's layout tree (§5.3, issue #12). */
  layout: LayoutNode;
  /** The one slot filling the whole grid, or none. */
  maximizedSlotId: SlotId | null;
  /** Points an existing slot at a different object. */
  setSlotUri: (slotId: SlotId, uri: Uri | null) => void;
  /** Points the visible primary slot at `uri` — what a deep link opens into. */
  seedPrimarySlot: (uri: Uri) => void;
  /** Turns a slot into two: itself, plus a new empty sibling. */
  splitSlot: (slotId: SlotId, orientation: SplitOrientation) => void;
  /** Exchanges what two slots show. */
  swapSlots: (a: SlotId, b: SlotId) => void;
  /** Persists a divider drag. */
  setSplitSizes: (splitId: SlotId, sizes: [number, number]) => void;
  /** Fills the grid with one slot, or restores the tree. */
  toggleMaximized: (slotId: SlotId) => void;
}

export type SlotId = string;
export type SplitOrientation = "horizontal" | "vertical";

/**
 * A leaf pane, or the two-way split that contains two of them.
 *
 * A slot holds a `Uri` and nothing else — never provider data, never a
 * `PanelId` alongside it — per §3.2's addressability invariant ("layout
 * presets... store URIs and nothing else"). `resolveUri` derives the panel a
 * slot mounts; storing that redundantly would be a second source of truth for
 * the same fact.
 */
export type LayoutNode =
  | { type: "slot"; id: SlotId; uri: Uri | null }
  | {
      type: "split";
      id: SlotId;
      orientation: SplitOrientation;
      /** Percentage (0..100) each child holds. */
      sizes: [number, number];
      children: [LayoutNode, LayoutNode];
    };

function nextSlotId(): SlotId {
  return `slot-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * The engine's default preset (§5.3: layouts are "named arrangements of
 * panels"). Arbitrary — the cockpit's real layout is #13's — chosen only to
 * exercise a nested split and prove one slot degrading independently of its
 * siblings (`security`'s fixture loader always rejects).
 */
const DEFAULT_LAYOUT: LayoutNode = {
  type: "split",
  id: "root",
  orientation: "horizontal",
  sizes: [60, 40],
  children: [
    {
      type: "split",
      id: "left",
      orientation: "vertical",
      sizes: [55, 45],
      children: [
        {
          type: "slot",
          id: "repos",
          uri: toUri("repo://github/acme/checkout-svc"),
        },
        {
          type: "slot",
          id: "prs",
          uri: toUri("pr://github/acme/checkout-svc/482"),
        },
      ],
    },
    {
      type: "split",
      id: "right",
      orientation: "vertical",
      sizes: [50, 50],
      children: [
        { type: "slot", id: "environments", uri: toUri("env://qa") },
        {
          type: "slot",
          id: "security",
          uri: toUri("alert://github/codeql/1234"),
        },
      ],
    },
  ],
};

function findNode(node: LayoutNode, id: SlotId): LayoutNode | null {
  if (node.id === id) return node;
  if (node.type === "split") {
    return findNode(node.children[0], id) ?? findNode(node.children[1], id);
  }
  return null;
}

function updateNode(
  node: LayoutNode,
  id: SlotId,
  fn: (node: LayoutNode) => LayoutNode,
): LayoutNode {
  if (node.id === id) return fn(node);
  if (node.type === "split") {
    return {
      ...node,
      children: [
        updateNode(node.children[0], id, fn),
        updateNode(node.children[1], id, fn),
      ],
    };
  }
  return node;
}

/** Every leaf slot in the tree, depth-first — what a "swap with…" picker lists. */
export function listSlots(
  node: LayoutNode,
): Array<Extract<LayoutNode, { type: "slot" }>> {
  if (node.type === "slot") return [node];
  return [...listSlots(node.children[0]), ...listSlots(node.children[1])];
}

export const useUiStore = create<UiState>((set) => ({
  contextPanelOpen: false,
  setContextPanelOpen: (open) => set({ contextPanelOpen: open }),
  toggleContextPanel: () =>
    set((state) => ({ contextPanelOpen: !state.contextPanelOpen })),

  layout: DEFAULT_LAYOUT,
  maximizedSlotId: null,

  setSlotUri: (slotId, uri) =>
    set((state) => ({
      layout: updateNode(state.layout, slotId, (node) =>
        node.type === "slot" ? { ...node, uri } : node,
      ),
    })),

  /**
   * The primary slot is whichever one the deep-linked object will actually be
   * seen in: the maximized slot when there is one, and the first slot in
   * document order otherwise. Seeding the first slot unconditionally drops the
   * link on the floor whenever some other slot is filling the grid.
   */
  seedPrimarySlot: (uri) =>
    set((state) => {
      const slots = listSlots(state.layout);
      const primary =
        slots.find((slot) => slot.id === state.maximizedSlotId) ?? slots[0];
      if (!primary || primary.uri === uri) return state;
      return {
        layout: updateNode(state.layout, primary.id, (node) =>
          node.type === "slot" ? { ...node, uri } : node,
        ),
      };
    }),

  splitSlot: (slotId, orientation) =>
    set((state) => ({
      // Splitting the maximized slot leaves maximized mode. The slot keeps its
      // id, so the grid would go on rendering that one leaf and the new sibling
      // would never appear — a dead-looking button that quietly accumulates
      // hidden slots on every click.
      maximizedSlotId:
        state.maximizedSlotId === slotId ? null : state.maximizedSlotId,
      layout: updateNode(state.layout, slotId, (node) => {
        if (node.type !== "slot") return node;
        return {
          type: "split",
          id: nextSlotId(),
          orientation,
          sizes: [50, 50],
          // The original slot keeps its id and uri; only its new sibling is
          // new, so nothing it was showing moves or reloads.
          children: [node, { type: "slot", id: nextSlotId(), uri: null }],
        };
      }),
    })),

  swapSlots: (a, b) =>
    set((state) => {
      const nodeA = findNode(state.layout, a);
      const nodeB = findNode(state.layout, b);
      if (!nodeA || !nodeB || nodeA.type !== "slot" || nodeB.type !== "slot") {
        return state;
      }

      const layout = updateNode(
        updateNode(state.layout, a, (node) =>
          node.type === "slot" ? { ...node, uri: nodeB.uri } : node,
        ),
        b,
        (node) => (node.type === "slot" ? { ...node, uri: nodeA.uri } : node),
      );
      return { layout };
    }),

  setSplitSizes: (splitId, sizes) =>
    set((state) => ({
      layout: updateNode(state.layout, splitId, (node) =>
        node.type === "split" ? { ...node, sizes } : node,
      ),
    })),

  toggleMaximized: (slotId) =>
    set((state) => ({
      maximizedSlotId: state.maximizedSlotId === slotId ? null : slotId,
    })),
}));
