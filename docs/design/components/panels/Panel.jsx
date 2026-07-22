import React from "react";
export function Panel({ title, asOf, actions, children, pad = true, style }) {
  return (
    <section
      style={{
        background: "var(--surface-panel)",
        border: "1px solid var(--border-1)",
        borderRadius: "var(--radius-2)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        minWidth: 0,
        ...style,
      }}
    >
      <header
        style={{
          height: "var(--panel-header-h)",
          flex: "0 0 auto",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 10px",
          borderBottom: "1px solid var(--border-1)",
        }}
      >
        <span
          style={{
            fontSize: "var(--fs-base)",
            fontWeight: 600,
            color: "var(--text-1)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </span>
        <span style={{ flex: 1 }}></span>
        {asOf ? (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--fs-2xs)",
              color: "var(--text-3)",
              whiteSpace: "nowrap",
            }}
          >
            as of {asOf}
          </span>
        ) : null}
        {actions}
      </header>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          padding: pad ? 10 : 0,
        }}
      >
        {children}
      </div>
    </section>
  );
}
