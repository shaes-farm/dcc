import React from "react";
export function ErrorCard({ title = "Provider unreachable", detail, action }) {
  return (
    <div
      style={{
        background: "var(--status-failing-dim)",
        border: "1px solid rgba(248,81,73,.3)",
        borderRadius: "var(--radius-2)",
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          color: "var(--status-failing)",
          fontWeight: 600,
          fontSize: "var(--fs-base)",
        }}
      >
        <span aria-hidden="true">⛔</span>
        {title}
      </div>
      {detail ? (
        <div
          style={{
            color: "var(--text-2)",
            fontSize: "var(--fs-sm)",
            fontFamily: "var(--font-mono)",
            lineHeight: "var(--lh-normal)",
          }}
        >
          {detail}
        </div>
      ) : null}
      {action ? <div style={{ marginTop: 2 }}>{action}</div> : null}
    </div>
  );
}
