import React from "react";
export function EmptyState({ message, action }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: "28px 16px",
        textAlign: "center",
      }}
    >
      <span style={{ color: "var(--text-3)", fontSize: "var(--fs-base)" }}>
        {message}
      </span>
      {action ? <span style={{ display: "inline-flex" }}>{action}</span> : null}
    </div>
  );
}
