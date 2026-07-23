import React from "react";
const V = {
  primary: {
    background: "var(--accent)",
    color: "var(--accent-fg)",
    border: "1px solid transparent",
  },
  secondary: {
    background: "var(--bg-3)",
    color: "var(--text-1)",
    border: "1px solid var(--border-2)",
  },
  ghost: {
    background: "transparent",
    color: "var(--text-2)",
    border: "1px solid transparent",
  },
  danger: {
    background: "var(--status-failing-dim)",
    color: "var(--status-failing)",
    border: "1px solid rgba(248,81,73,.35)",
  },
};
export function Button({
  variant = "secondary",
  size = "md",
  icon,
  disabled,
  children,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false),
    [press, setPress] = React.useState(false);
  const base = V[variant] || V.secondary;
  let bg = base.background,
    color = base.color;
  if (!disabled && hover) {
    if (variant === "primary")
      bg = press ? "var(--accent-press)" : "var(--accent-hover)";
    else if (variant === "ghost") {
      bg = "var(--bg-2)";
      color = "var(--text-1)";
    } else if (variant === "danger") bg = "rgba(248,81,73,.24)";
    else bg = press ? "var(--bg-2)" : "#222D3B";
  }
  return (
    <button
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setPress(false);
      }}
      onMouseDown={() => setPress(true)}
      onMouseUp={() => setPress(false)}
      style={{
        ...base,
        background: bg,
        color,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height:
          size === "sm"
            ? 24
            : size === "lg"
              ? "var(--control-h-lg)"
              : "var(--control-h)",
        padding: size === "sm" ? "0 8px" : "0 12px",
        borderRadius: "var(--radius-1)",
        fontFamily: "var(--font-ui)",
        fontSize: size === "sm" ? "var(--fs-sm)" : "var(--fs-base)",
        fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        transition:
          "background var(--dur-fast) var(--ease-out),color var(--dur-fast) var(--ease-out)",
        whiteSpace: "nowrap",
        ...style,
      }}
      {...rest}
    >
      {icon ? (
        <span
          style={{ display: "inline-flex", fontSize: "1em", lineHeight: 1 }}
        >
          {icon}
        </span>
      ) : null}
      {children}
    </button>
  );
}
