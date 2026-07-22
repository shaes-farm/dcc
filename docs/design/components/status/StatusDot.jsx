import React from "react";
export const STATUS_COLORS = {
  healthy: "var(--status-healthy)",
  degraded: "var(--status-degraded)",
  failing: "var(--status-failing)",
  deploying: "var(--status-deploying)",
  unknown: "var(--status-unknown)",
};
export function StatusDot({ status = "unknown", size = 8, pulse }) {
  return (
    <span
      aria-label={status}
      title={status}
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "50%",
        background: STATUS_COLORS[status] || STATUS_COLORS.unknown,
        flex: "0 0 auto",
        animation:
          pulse && status === "deploying"
            ? "dcc-pulse 1.6s ease-in-out infinite"
            : "none",
      }}
    >
      <style>
        {"@keyframes dcc-pulse{0%,100%{opacity:1}50%{opacity:.35}}"}
      </style>
    </span>
  );
}
