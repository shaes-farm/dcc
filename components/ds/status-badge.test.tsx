// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { STATUSES } from "@/lib/domain";

import { StatusBadge } from "./status-badge";
import { STATUS_VISUALS } from "./status-visuals";

afterEach(cleanup);

/**
 * §8's rule is that status colors are "colorblind-safe pairs with icons, never
 * color alone". A color is not assertable from here — but the glyph that has
 * to accompany it is, and the glyph is the half that survives a grayscale
 * screenshot or a reader who cannot separate the greens from the reds.
 */
describe("StatusBadge", () => {
  it("renders a glyph for every status in the vocabulary (§8)", () => {
    for (const status of STATUSES) {
      const { container } = render(<StatusBadge status={status} />);

      expect(container.textContent).toContain(STATUS_VISUALS[status].glyph);
      cleanup();
    }
  });

  it("gives every status a glyph nothing else uses", () => {
    const glyphs = STATUSES.map((status) => STATUS_VISUALS[status].glyph);

    expect(new Set(glyphs).size).toBe(STATUSES.length);
    expect(glyphs.every((glyph) => glyph.length > 0)).toBe(true);
  });

  it("labels itself with the status word, and keeps the glyph when overridden", () => {
    render(<StatusBadge status="healthy" />);
    expect(screen.getByText(/healthy/)).toBeDefined();

    cleanup();

    const { container } = render(
      <StatusBadge status="failing">CrashLoopBackOff</StatusBadge>,
    );
    expect(container.textContent).toContain("CrashLoopBackOff");
    expect(container.textContent).toContain(STATUS_VISUALS.failing.glyph);
  });

  it("hides the glyph from screen readers, which have the label", () => {
    const { container } = render(<StatusBadge status="degraded" />);

    expect(container.querySelector('[aria-hidden="true"]')?.textContent).toBe(
      STATUS_VISUALS.degraded.glyph,
    );
  });
});
