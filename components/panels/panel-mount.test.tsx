// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { toUri } from "@/lib/domain";

import { PanelMount } from "./panel-mount";

afterEach(cleanup);

describe("PanelMount (spec §3.2, issue #12)", () => {
  it("mounts a panel from a Resolution alone — a Uri in, a Panel out", async () => {
    render(<PanelMount uri={toUri("repo://github/acme/checkout-svc")} />);

    expect(screen.getByText(/loading/i)).toBeDefined();
    expect(
      await screen.findByText("Repository · acme/checkout-svc"),
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
