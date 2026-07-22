import React from "react";
export function IconButton({
  label,
  children,
  active,
  disabled,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      aria-label={label}
      title={label}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "var(--control-h)",
        height: "var(--control-h)",
        borderRadius: "var(--radius-1)",
        border: "1px solid transparent",
        background: active
          ? "var(--accent-dim)"
          : hover && !disabled
            ? "var(--bg-3)"
            : "transparent",
        color: active
          ? "var(--accent)"
          : hover && !disabled
            ? "var(--text-1)"
            : "var(--text-2)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        fontSize: 14,
        lineHeight: 1,
        transition:
          "background var(--dur-fast) var(--ease-out),color var(--dur-fast) var(--ease-out)",
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
