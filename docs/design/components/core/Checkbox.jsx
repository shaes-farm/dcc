import React from "react";
export function Checkbox({ checked, onChange, label, disabled }) {
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
        role="checkbox"
        aria-checked={!!checked}
        style={{
          width: 15,
          height: 15,
          flex: "0 0 auto",
          borderRadius: 3,
          border: `1px solid ${checked ? "var(--accent)" : "var(--border-2)"}`,
          background: checked ? "var(--accent)" : "var(--surface-input)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--accent-fg)",
          fontSize: 11,
          fontWeight: 700,
          lineHeight: 1,
          transition:
            "background var(--dur-fast) var(--ease-out),border-color var(--dur-fast) var(--ease-out)",
        }}
      >
        {checked ? "✓" : ""}
      </span>
      {label}
    </label>
  );
}
