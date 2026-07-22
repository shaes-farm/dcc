const { StatusDot, UriChip, Tag, Button } = window.DCCDesignSystem_28b72e;
function Palette({ onClose, onOpenService }) {
  const D = window.DCC_DATA;
  const [q, setQ] = React.useState("");
  const [sel, setSel] = React.useState(0);
  const inputRef = React.useRef(null);
  React.useEffect(() => {
    inputRef.current && inputRef.current.focus();
  }, []);
  const results = D.paletteIndex.filter((r) =>
    r.label.toLowerCase().includes(q.toLowerCase()),
  );
  const pick = (r) => {
    if (r.kind === "service" || r.uri.includes("checkout"))
      onOpenService("checkout");
    onClose();
  };
  const onKey = (e) => {
    if (e.key === "Escape") onClose();
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((s) => Math.min(s + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter" && results[sel]) pick(results[sel]);
  };
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--scrim)",
        zIndex: 50,
        display: "flex",
        justifyContent: "center",
        paddingTop: 110,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 560,
          height: "fit-content",
          background: "var(--bg-1)",
          border: "1px solid var(--border-2)",
          borderRadius: "var(--radius-3)",
          boxShadow: "var(--shadow-overlay)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 12px",
            borderBottom: "1px solid var(--border-1)",
          }}
        >
          <span
            style={{ color: "var(--text-3)", fontFamily: "var(--font-mono)" }}
          >
            ›
          </span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSel(0);
            }}
            onKeyDown={onKey}
            placeholder="Jump to anything — or paste a URI…"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text-1)",
              fontFamily: "var(--font-mono)",
              fontSize: "var(--fs-base)",
            }}
          />
          <kbd
            style={{
              background: "var(--bg-3)",
              border: "1px solid var(--border-2)",
              borderRadius: 3,
              padding: "1px 5px",
              fontFamily: "var(--font-mono)",
              fontSize: "var(--fs-2xs)",
              color: "var(--text-3)",
            }}
          >
            esc
          </kbd>
        </div>
        <div>
          {results.length === 0 ? (
            <div
              style={{
                padding: "14px 12px",
                color: "var(--text-3)",
                fontSize: "var(--fs-sm)",
              }}
            >
              No matches — try a service name or paste a URI
            </div>
          ) : (
            results.map((r, i) => (
              <div
                key={r.uri}
                onClick={() => pick(r)}
                onMouseEnter={() => setSel(i)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  padding: "7px 12px",
                  cursor: "pointer",
                  background: i === sel ? "var(--accent-dim)" : "transparent",
                  borderLeft:
                    i === sel
                      ? "2px solid var(--accent)"
                      : "2px solid transparent",
                }}
              >
                {r.dot ? (
                  <StatusDot status={r.dot} size={7} />
                ) : (
                  <span style={{ width: 7 }}></span>
                )}
                <span
                  style={{
                    fontSize: "var(--fs-base)",
                    color:
                      r.kind === "action" ? "var(--accent)" : "var(--text-1)",
                    flex: 1,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {r.label}
                </span>
                <Tag>{r.kind}</Tag>
              </div>
            ))
          )}
        </div>
        <div
          style={{
            padding: "6px 12px",
            borderTop: "1px solid var(--border-1)",
            fontFamily: "var(--font-mono)",
            fontSize: "var(--fs-2xs)",
            color: "var(--text-3)",
            display: "flex",
            gap: 12,
          }}
        >
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>actions confirm before running</span>
        </div>
      </div>
    </div>
  );
}
function ConfirmDialog({ onClose }) {
  const [typed, setTyped] = React.useState("");
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--scrim)",
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 440,
          background: "var(--bg-1)",
          border: "1px solid var(--border-2)",
          borderRadius: "var(--radius-3)",
          boxShadow: "var(--shadow-overlay)",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ fontSize: "var(--fs-lg)", fontWeight: 600 }}>
          Restart workload?
        </div>
        <div
          style={{
            fontSize: "var(--fs-base)",
            color: "var(--text-2)",
            lineHeight: "var(--lh-normal)",
          }}
        >
          Rollout restart of{" "}
          <code style={{ color: "var(--text-1)" }}>deployment/checkout</code> in{" "}
          <code style={{ color: "var(--text-1)" }}>qa</code> <Tag>shared</Tag>{" "}
          via <code>k8s-qa</code>. Pods are never deleted directly. The action
          is audit-logged.
        </div>
        <UriChip uri="action://restartWorkload?target=workload://qa/checkout/deployment/checkout" />
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onClose}>
            Restart workload
          </Button>
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { Palette, ConfirmDialog });
