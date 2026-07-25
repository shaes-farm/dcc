// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { toUri } from "@/lib/domain";

import { PanelMount } from "./panel-mount";

/**
 * A loaded panel renders its URI through `Addressable`, which reaches for the
 * App Router and throws without one — silently, in the state update that ends
 * the fixture load, taking the panel's success branch down with it. Mocked
 * rather than wrapped in a provider because nothing here is about navigation;
 * `deep-link.test.ts` owns that.
 */
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

afterEach(cleanup);

describe("PanelMount (spec §3.2, issue #12)", () => {
  it("mounts a panel from a Resolution alone — a Uri in, a Panel out", async () => {
    render(<PanelMount uri={toUri("repo://github/acme/checkout-svc")} />);

    expect(screen.getByText(/loading/i)).toBeDefined();

    // Awaited on the panel's *data*, not its header: the header is already
    // there in the loading state, so awaiting the title passes whether the
    // success branch ever renders or not.
    expect(await screen.findByText("main")).toBeDefined();
    expect(screen.getByText("Repository · acme/checkout-svc")).toBeDefined();

    // §3.2: what it rendered carries its URI.
    expect(
      screen.getByLabelText("repo://github/acme/checkout-svc"),
    ).toBeDefined();
  });

  it("falls back to an unimplemented-panel state for a PanelId with no fixture yet", () => {
    render(<PanelMount uri={toUri("workspace://commerce")} />);

    expect(screen.getByText("No panel for this URI yet")).toBeDefined();
  });

  it("never mounts a panel for an action:// URI (§7.1)", () => {
    const { container } = render(
      <PanelMount
        uri={toUri(
          "action://restartWorkload?target=workload://qa/checkout/deployment/checkout",
        )}
      />,
    );

    expect(container.firstChild).toBeNull();
  });
});

describe("independent degradation (§5.3)", () => {
  it("an unreachable fixture panel's ErrorCard does not stop its sibling from rendering", async () => {
    render(
      <>
        <PanelMount uri={toUri("alert://github/codeql/1234")} />
        <PanelMount uri={toUri("env://qa")} />
      </>,
    );

    expect(
      await screen.findByText(/401 from GitHub — check GITHUB_TOKEN/),
    ).toBeDefined();
    expect(await screen.findByText("checkout")).toBeDefined();
    expect(screen.getByText("payments")).toBeDefined();
  });
});
