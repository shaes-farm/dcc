import React from "react";
import { StatusDot } from "../status/StatusDot.jsx";
export function StatusBar({
  workspace = "Acme Commerce",
  preset = "Debugging",
  polling = true,
  issues = 0,
  clock = "14:32",
}) {
  const ok = issues === 0;
  return (
    <footer
      style={{
        height: "var(--statusbar-h)",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "0 12px",
        background: "var(--bg-1)",
        borderTop: "1px solid var(--border-1)",
        fontFamily: "var(--font-mono)",
        fontSize: "var(--fs-xs)",
        color: "var(--text-2)",
      }}
    >
      <span style={{ color: "var(--text-1)", fontWeight: 600 }}>
        {workspace}
      </span>
      <span style={{ color: "var(--text-3)" }}>layout: {preset}</span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
        <StatusDot status={polling ? "healthy" : "unknown"} size={6} /> polling{" "}
        {polling ? "on" : "paused"}
      </span>
      <span style={{ flex: 1 }}></span>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          color: ok ? "var(--status-healthy)" : "var(--status-degraded)",
        }}
      >
        <span aria-hidden="true">{ok ? "✓" : "⚠"}</span>
        {ok ? "system OK" : `${issues} issues`}
      </span>
      <span style={{ color: "var(--text-3)" }}>{clock}</span>
    </footer>
  );
}
