import React from "react";
export function Tag({ children, accent }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 18,
        padding: "0 6px",
        borderRadius: "var(--radius-1)",
        background: accent ? "var(--accent-dim)" : "var(--bg-3)",
        color: accent ? "var(--accent)" : "var(--text-2)",
        border: `1px solid ${accent ? "rgba(52,198,236,.3)" : "var(--border-1)"}`,
        fontFamily: "var(--font-mono)",
        fontSize: "var(--fs-2xs)",
        lineHeight: 1,
        whiteSpace: "nowrap",
        letterSpacing: ".02em",
      }}
    >
      {children}
    </span>
  );
}
