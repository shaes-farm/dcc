import React from "react";
export function Input({ mono, invalid, style, ...rest }) {
  const [focus, setFocus] = React.useState(false);
  return (
    <input
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={{
        height: "var(--control-h)",
        boxSizing: "border-box",
        padding: "0 10px",
        background: "var(--surface-input)",
        color: "var(--text-1)",
        border: `1px solid ${invalid ? "var(--status-failing)" : focus ? "var(--accent)" : "var(--border-2)"}`,
        borderRadius: "var(--radius-1)",
        fontFamily: mono ? "var(--font-mono)" : "var(--font-ui)",
        fontSize: mono ? "var(--fs-sm)" : "var(--fs-base)",
        outline: "none",
        boxShadow: focus ? "var(--focus-ring)" : "none",
        transition:
          "border-color var(--dur-fast) var(--ease-out),box-shadow var(--dur-fast) var(--ease-out)",
        width: "100%",
      }}
      {...rest}
    />
  );
}
