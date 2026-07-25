import type { Status } from "@/lib/domain";

/**
 * How each status looks (spec §8).
 *
 * §8's rule is that status colors are the only saturated colors on screen and
 * that they are "colorblind-safe pairs with icons, never color alone". This is
 * the one place that pairing is defined, so there is no way to add a status
 * color somewhere without also picking up its glyph.
 *
 * Keyed by `Status` from the domain (`lib/domain/common.ts`), not by a restated
 * union — the design system's own `.d.ts` files inline the five strings, which
 * is a limitation of that export, not a second vocabulary. A status added to
 * `STATUSES` is a type error here until it is given a look.
 *
 * The class strings are written out in full rather than composed, because
 * Tailwind scans source text: `bg-status-${status}` would compile to nothing.
 */
export interface StatusVisual {
  /** Paired with the color everywhere the color appears. */
  glyph: string;
  /** Saturated color, for text and dot fills. */
  text: string;
  dot: string;
  /** 14%-alpha tint, for badge and row backgrounds. */
  dim: string;
}

export const STATUS_VISUALS: Record<Status, StatusVisual> = {
  healthy: {
    glyph: "✓",
    text: "text-status-healthy",
    dot: "bg-status-healthy",
    dim: "bg-status-healthy-dim",
  },
  degraded: {
    glyph: "⚠",
    text: "text-status-degraded",
    dot: "bg-status-degraded",
    dim: "bg-status-degraded-dim",
  },
  failing: {
    glyph: "⛔",
    text: "text-status-failing",
    dot: "bg-status-failing",
    dim: "bg-status-failing-dim",
  },
  deploying: {
    glyph: "⏳",
    text: "text-status-deploying",
    dot: "bg-status-deploying",
    dim: "bg-status-deploying-dim",
  },
  unknown: {
    glyph: "○",
    text: "text-status-unknown",
    dot: "bg-status-unknown",
    dim: "bg-status-unknown-dim",
  },
};
