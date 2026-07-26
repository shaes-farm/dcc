// @vitest-environment jsdom

import { cleanup, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { toUri } from "@/lib/domain";

import { PanelMount } from "./panel-mount";
import { CHECKOUT_REPO, renderWithQuery, stubFetch } from "./panel-test-utils";

/**
 * A loaded panel renders its URI through `Addressable`, which reaches for the
 * App Router and throws without one — silently, in the state update that ends
 * the load, taking the panel's success branch down with it. Mocked rather than
 * wrapped in a provider because nothing here is about navigation;
 * `deep-link.test.ts` owns that.
 */
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

beforeEach(() => {
  stubFetch([{ match: "/api/git/repos", body: [CHECKOUT_REPO] }]);
});

afterEach(() => {
  vi.unstubAllGlobals();
  cleanup();
});

describe("PanelMount (spec §3.2, issue #12)", () => {
  it("mounts a panel from a Resolution alone — a Uri in, a Panel out", async () => {
    renderWithQuery(
      <PanelMount uri={toUri("repo://github/acme/checkout-svc")} />,
    );

    expect(screen.getByText(/loading/i)).toBeDefined();

    // Awaited on the panel's *data*, not its header: the header is already
    // there in the loading state, so awaiting the title passes whether the
    // success branch ever renders or not.
    expect(await screen.findByText("service")).toBeDefined();
    expect(screen.getByText("Repository · acme/checkout-svc")).toBeDefined();

    // §3.2: what it rendered carries its URI.
    expect(
      screen.getByLabelText("repo://github/acme/checkout-svc"),
    ).toBeDefined();
  });

  it("falls back to an unimplemented-panel state for a PanelId with no component yet", () => {
    renderWithQuery(<PanelMount uri={toUri("workspace://commerce")} />);

    expect(screen.getByText("No panel for this URI yet")).toBeDefined();
  });

  it("never mounts a panel for an action:// URI (§7.1)", () => {
    const { container } = renderWithQuery(
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
  it("an unreachable provider's ErrorCard does not stop its sibling from rendering", async () => {
    // A real 401, from the real error path — the route handler's shape, with
    // the sentence the adapter authored.
    stubFetch([
      {
        match: "/api/git/alerts",
        status: 401,
        body: {
          error: {
            message: "401 from GitHub — check GITHUB_TOKEN in your shell.",
          },
        },
      },
    ]);

    renderWithQuery(
      <>
        <PanelMount uri={toUri("alert://github/codeql/1234")} />
        <PanelMount uri={toUri("env://qa")} />
      </>,
    );

    expect(
      await screen.findByText(/401 from GitHub — check GITHUB_TOKEN/),
    ).toBeDefined();
    // CLAUDE.md's other half of the bar: which panels go stale until it is fixed.
    expect(screen.getByText(/stay stale until this is fixed/)).toBeDefined();

    // The sibling — still a fixture until #10's DeploymentProvider — is intact.
    expect(await screen.findByText("checkout")).toBeDefined();
    expect(screen.getByText("payments")).toBeDefined();
  });
});
