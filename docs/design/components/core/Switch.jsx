import React from "react";
export function Switch({ checked, onChange, label, disabled }) {
  return (
    <label
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        fontSize: "var(--fs-base)",
        color: "var(--text-1)",
        userSelect: "none",
      }}
    >
      <span
        onClick={() => !disabled && onChange && onChange(!checked)}
        role="switch"
        aria-checked={!!checked}
        style={{
          width: 30,
          height: 16,
          flex: "0 0 auto",
          borderRadius: "var(--radius-full)",
          background: checked ? "var(--accent)" : "var(--bg-3)",
          border: `1px solid ${checked ? "var(--accent)" : "var(--border-2)"}`,
          position: "relative",
          transition: "background var(--dur-med) var(--ease-out)",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 1,
            left: checked ? 15 : 1,
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: checked ? "var(--accent-fg)" : "var(--text-2)",
            transition:
              "left var(--dur-med) var(--ease-out),background var(--dur-med) var(--ease-out)",
          }}
        ></span>
      </span>
      {label}
    </label>
  );
}
