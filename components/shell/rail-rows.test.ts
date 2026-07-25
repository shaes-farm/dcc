import { describe, expect, it } from "vitest";

import type { DccConfig } from "@/lib/config/schema";
import { parseUri } from "@/lib/domain";

import { serviceRailRows } from "./rail-rows";

const workspace = { name: "Acme Commerce" };

describe("serviceRailRows", () => {
  it("addresses every row by its service:// URI (§3.2)", () => {
    const rows = serviceRailRows({
      workspace,
      services: [{ id: "checkout" }, { id: "catalog" }],
    } satisfies DccConfig);

    expect(rows.map((row) => row.uri)).toEqual([
      "service://checkout",
      "service://catalog",
    ]);
    // Minted, not concatenated: each one reads back through the codec.
    for (const row of rows) {
      expect(parseUri(row.uri)).toEqual({
        scheme: "service",
        service: expect.any(String),
      });
    }
  });

  it("falls back to the id when a service declares no name (§4.2)", () => {
    const rows = serviceRailRows({
      workspace,
      services: [{ id: "img-resizer" }, { id: "ui-kit", name: "UI Library" }],
    } satisfies DccConfig);

    expect(rows.map((row) => row.label)).toEqual(["img-resizer", "UI Library"]);
  });

  it("renders every service as unknown until something reports (§2.2)", () => {
    const rows = serviceRailRows({
      workspace,
      services: [{ id: "checkout" }],
    } satisfies DccConfig);

    expect(rows.map((row) => row.status)).toEqual(["unknown"]);
  });

  it("yields nothing when no services are configured", () => {
    expect(serviceRailRows({ workspace } satisfies DccConfig)).toEqual([]);
    expect(serviceRailRows({ workspace, services: [] })).toEqual([]);
  });
});
