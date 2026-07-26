// @vitest-environment jsdom

import { cleanup, screen } from "@testing-library/react";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { toUri } from "@/lib/domain";
import { listSlots, useUiStore } from "@/lib/stores/ui";

import {
  CHECKOUT_PR,
  CHECKOUT_REPO,
  renderWithQuery,
  stubFetch,
} from "./panel-test-utils";
import { SlotGrid } from "./slot-grid";

/** See `panel-mount.test.tsx` — a loaded panel reaches for the App Router. */
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

/**
 * `react-resizable-panels` observes each group's box on mount, and jsdom ships
 * no `ResizeObserver`. A stub is enough: nothing here asserts on measured
 * sizes, which jsdom has none of anyway.
 */
beforeAll(() => {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const INITIAL_STATE = useUiStore.getState();

beforeEach(() => {
  useUiStore.setState(INITIAL_STATE, true);
  // The default layout seeds git panels, which now read `/api/git/*`.
  stubFetch([
    { match: "/api/git/repos", body: [CHECKOUT_REPO] },
    { match: "/api/git/prs", body: [CHECKOUT_PR] },
    { match: "/api/git/alerts", body: [] },
  ]);
});

afterEach(() => {
  vi.unstubAllGlobals();
  cleanup();
});

describe("SlotGrid (spec §5.3, issue #12)", () => {
  it("gives every group and pane its own DOM id", () => {
    const { container } = renderWithQuery(<SlotGrid />);

    // `react-resizable-panels` stamps `id` and `data-testid` on both a group
    // and the pane containing it, so a split node handing its own id to each
    // puts two elements in the document under it.
    const ids = [...container.querySelectorAll("[id]")].map((el) => el.id);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps a slot pointed at an action:// URI a pane, not a blank box (§7.1)", () => {
    const primary = listSlots(useUiStore.getState().layout)[0];
    useUiStore
      .getState()
      .setSlotUri(
        primary.id,
        toUri(
          "action://restartWorkload?target=workload://qa/checkout/deployment/checkout",
        ),
      );

    renderWithQuery(<SlotGrid />);

    // An action mounts no panel, but the slot still has to say so and stay
    // usable — otherwise the pane has no header and no way back out of it.
    expect(screen.getByText(/is an action/)).toBeDefined();
    expect(screen.getAllByLabelText("Maximize").length).toBeGreaterThan(0);
  });
});
