// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { DccConfig } from "@/lib/config/schema";

import { ServiceRail } from "./service-rail";

/**
 * The rail nests `Addressable`, a client component that reaches for the App
 * Router. Mocked rather than wrapped in a provider because none of what is
 * asserted below is about navigation — `use-uri-navigation.ts` and
 * `deep-link.test.ts` already own that — and a real router would only add a
 * way for these tests to fail for an unrelated reason.
 */
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

afterEach(cleanup);

const workspace = { name: "Acme Commerce" };

describe("ServiceRail", () => {
  it("lists one row per configured service, addressed by its URI (§5.2, §3.2)", () => {
    render(
      <ServiceRail
        config={
          {
            workspace,
            services: [
              { id: "checkout", name: "Checkout Service" },
              { id: "catalog" },
            ],
          } satisfies DccConfig
        }
      />,
    );

    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(2);

    // The URI *is* the row's accessible name — `Addressable` puts it there, so
    // the row announces `service://checkout`, not "Checkout Service".
    expect(
      within(rows[0]).getByRole("link", { name: "service://checkout" }),
    ).toBeDefined();
    expect(within(rows[0]).getByText("Checkout Service")).toBeDefined();

    // No declared name — the row falls back to the id rather than prettifying.
    expect(
      within(rows[1]).getByRole("link", { name: "service://catalog" }),
    ).toBeDefined();
    expect(within(rows[1]).getByText("catalog")).toBeDefined();
  });

  it("carries the URI where a reader can see it, not just in the href (§3.2)", () => {
    render(
      <ServiceRail
        config={
          { workspace, services: [{ id: "checkout" }] } satisfies DccConfig
        }
      />,
    );

    expect(screen.getByTitle("service://checkout")).toBeDefined();
  });

  it("renders every dot as unknown until something reports (§2.2)", () => {
    render(
      <ServiceRail
        config={
          {
            workspace,
            services: [{ id: "checkout" }, { id: "catalog" }],
          } satisfies DccConfig
        }
      />,
    );

    // One per service row, plus the workspace rollup in the header.
    expect(screen.getAllByLabelText("unknown")).toHaveLength(3);
  });

  it("points at the config file when no services are declared (§8)", () => {
    render(<ServiceRail config={{ workspace } satisfies DccConfig} />);

    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
    expect(screen.getByText(/No services configured/)).toBeDefined();
    expect(screen.getByText("dcc.config.json")).toBeDefined();
  });

  it("names the workspace it is showing", () => {
    render(<ServiceRail config={{ workspace } satisfies DccConfig} />);

    expect(screen.getByText("Acme Commerce")).toBeDefined();
  });
});
