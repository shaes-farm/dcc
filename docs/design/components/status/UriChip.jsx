import React from "react";
export function UriChip({ uri, onClick }) {
  const [hover, setHover] = React.useState(false);
  const i = uri.indexOf("://");
  const scheme = i > 0 ? uri.slice(0, i) : "";
  const rest = i > 0 ? uri.slice(i) : uri;
  return (
    <span
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title="Copy link · paste in palette to jump"
      style={{
        display: "inline-flex",
        alignItems: "center",
        maxWidth: "100%",
        height: 20,
        padding: "0 7px",
        borderRadius: "var(--radius-1)",
        background: hover ? "var(--bg-3)" : "var(--bg-2)",
        border: `1px solid ${hover ? "var(--border-2)" : "var(--border-1)"}`,
        fontFamily: "var(--font-mono)",
        fontSize: "var(--fs-xs)",
        cursor: onClick ? "pointer" : "default",
        whiteSpace: "nowrap",
        overflow: "hidden",
        transition: "background var(--dur-fast) var(--ease-out)",
      }}
    >
      <span style={{ color: "var(--accent)" }}>{scheme}</span>
      <span
        style={{
          color: "var(--text-2)",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {rest}
      </span>
    </span>
  );
}
