import React from "react";
export function Select({ options = [], mono, style, ...rest }) {
  const [focus, setFocus] = React.useState(false);
  return (
    <div
      style={{
        position: "relative",
        display: "inline-block",
        width: style?.width || "auto",
        ...style,
      }}
    >
      <select
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          appearance: "none",
          WebkitAppearance: "none",
          height: "var(--control-h)",
          boxSizing: "border-box",
          padding: "0 26px 0 10px",
          background: "var(--surface-input)",
          color: "var(--text-1)",
          border: `1px solid ${focus ? "var(--accent)" : "var(--border-2)"}`,
          borderRadius: "var(--radius-1)",
          fontFamily: mono ? "var(--font-mono)" : "var(--font-ui)",
          fontSize: mono ? "var(--fs-sm)" : "var(--fs-base)",
          outline: "none",
          boxShadow: focus ? "var(--focus-ring)" : "none",
          cursor: "pointer",
          width: "100%",
        }}
        {...rest}
      >
        {options.map((o) =>
          typeof o === "string" ? (
            <option key={o} value={o}>
              {o}
            </option>
          ) : (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ),
        )}
      </select>
      <span
        style={{
          position: "absolute",
          right: 9,
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          color: "var(--text-3)",
          fontSize: 9,
        }}
      >
        ▾
      </span>
    </div>
  );
}
