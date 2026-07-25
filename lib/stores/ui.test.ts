import { beforeEach, describe, expect, it } from "vitest";

import { toUri } from "@/lib/domain";

import { listSlots, useUiStore, type LayoutNode } from "./ui";

const INITIAL_STATE = useUiStore.getState();

beforeEach(() => {
  useUiStore.setState(INITIAL_STATE, true);
});

function slotIds(node: LayoutNode): string[] {
  return listSlots(node).map((slot) => slot.id);
}

describe("layout tree (spec §3.2, issue #12)", () => {
  it("starts with a preset arrangement of leaf slots, depth-first", () => {
    expect(slotIds(useUiStore.getState().layout)).toEqual([
      "repos",
      "prs",
      "environments",
      "security",
    ]);
  });

  it("stores only a Uri on each leaf — never provider data or a redundant panel id", () => {
    for (const slot of listSlots(useUiStore.getState().layout)) {
      expect(Object.keys(slot).sort()).toEqual(["id", "type", "uri"]);
    }
  });
});

describe("splitSlot", () => {
  it("turns a slot into two, keeping the original's id and uri on one side", () => {
    useUiStore.getState().splitSlot("repos", "vertical");

    const layout = useUiStore.getState().layout;
    const ids = slotIds(layout);
    expect(ids).toContain("repos");
    expect(ids).toHaveLength(5);

    const repos = listSlots(layout).find((slot) => slot.id === "repos");
    expect(repos?.uri).toBe(toUri("repo://github/acme/checkout-svc"));
  });

  it("gives the new sibling an empty (null) uri", () => {
    useUiStore.getState().splitSlot("repos", "vertical");

    const newSlot = listSlots(useUiStore.getState().layout).find(
      (slot) => slot.id !== "repos" && slot.uri === null,
    );
    expect(newSlot).toBeDefined();
  });

  it("leaves every other slot untouched", () => {
    useUiStore.getState().splitSlot("repos", "vertical");
    expect(slotIds(useUiStore.getState().layout)).toEqual(
      expect.arrayContaining(["prs", "environments", "security"]),
    );
  });
});

describe("swapSlots", () => {
  it("exchanges what two slots show", () => {
    const before = useUiStore.getState().layout;
    const reposUri = listSlots(before).find((s) => s.id === "repos")?.uri;
    const prsUri = listSlots(before).find((s) => s.id === "prs")?.uri;

    useUiStore.getState().swapSlots("repos", "prs");

    const after = listSlots(useUiStore.getState().layout);
    expect(after.find((s) => s.id === "repos")?.uri).toBe(prsUri);
    expect(after.find((s) => s.id === "prs")?.uri).toBe(reposUri);
  });

  it("is a no-op when either id does not name a slot", () => {
    const before = useUiStore.getState().layout;
    useUiStore.getState().swapSlots("repos", "root"); // "root" is a split, not a slot
    expect(useUiStore.getState().layout).toBe(before);
  });
});

describe("setSplitSizes", () => {
  it("updates only the targeted split's sizes", () => {
    useUiStore.getState().setSplitSizes("left", [70, 30]);

    const layout = useUiStore.getState().layout;
    expect(layout.type).toBe("split");
    if (layout.type !== "split") throw new Error("unreachable");
    const left = layout.children[0];
    expect(left.type).toBe("split");
    if (left.type !== "split") throw new Error("unreachable");
    expect(left.sizes).toEqual([70, 30]);
    expect(layout.sizes).toEqual([60, 40]); // root untouched
  });
});

describe("toggleMaximized", () => {
  it("sets, then clears, the maximized slot on repeated toggles", () => {
    expect(useUiStore.getState().maximizedSlotId).toBeNull();

    useUiStore.getState().toggleMaximized("repos");
    expect(useUiStore.getState().maximizedSlotId).toBe("repos");

    useUiStore.getState().toggleMaximized("repos");
    expect(useUiStore.getState().maximizedSlotId).toBeNull();
  });
});

describe("seedPrimarySlot", () => {
  it("points the first slot in document order at the given uri", () => {
    const uri = toUri("service://checkout");
    useUiStore.getState().seedPrimarySlot(uri);

    const primary = listSlots(useUiStore.getState().layout)[0];
    expect(primary.id).toBe("repos");
    expect(primary.uri).toBe(uri);
  });

  it("leaves the layout untouched when the primary slot already shows that uri", () => {
    const before = useUiStore.getState().layout;
    const primaryUri = listSlots(before)[0].uri;
    if (!primaryUri)
      throw new Error("fixture assumption: primary slot has a uri");

    useUiStore.getState().seedPrimarySlot(primaryUri);
    expect(useUiStore.getState().layout).toBe(before);
  });
});
