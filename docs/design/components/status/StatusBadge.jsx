import React from "react";
const M = {
  healthy: {
    glyph: "✓",
    c: "var(--status-healthy)",
    bg: "var(--status-healthy-dim)",
  },
  degraded: {
    glyph: "⚠",
    c: "var(--status-degraded)",
    bg: "var(--status-degraded-dim)",
  },
  failing: {
    glyph: "⛔",
    c: "var(--status-failing)",
    bg: "var(--status-failing-dim)",
  },
  deploying: {
    glyph: "⏳",
    c: "var(--status-deploying)",
    bg: "var(--status-deploying-dim)",
  },
  unknown: {
    glyph: "○",
    c: "var(--status-unknown)",
    bg: "var(--status-unknown-dim)",
  },
};
export function StatusBadge({ status = "unknown", children }) {
  const s = M[status] || M.unknown;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        height: 18,
        padding: "0 8px",
        borderRadius: "var(--radius-full)",
        background: s.bg,
        color: s.c,
        fontFamily: "var(--font-mono)",
        fontSize: "var(--fs-xs)",
        fontWeight: 500,
        whiteSpace: "nowrap",
        lineHeight: 1,
      }}
    >
      <span aria-hidden="true">{s.glyph}</span>
      {children || status}
    </span>
  );
}
