const { IconButton, Button, StatusBadge, UriChip, Tag, Switch } =
  window.DCCDesignSystem_28b72e;
function PodDrawer({ pod, onClose, onRestart }) {
  const D = window.DCC_DATA;
  const sec = {
    fontSize: "var(--fs-2xs)",
    color: "var(--text-3)",
    textTransform: "uppercase",
    letterSpacing: "var(--tracking-overline)",
    margin: "10px 0 6px",
  };
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: "var(--statusbar-h)",
        width: "var(--drawer-w)",
        background: "var(--bg-1)",
        borderLeft: "1px solid var(--border-2)",
        boxShadow: "var(--shadow-drawer)",
        zIndex: 40,
        display: "flex",
        flexDirection: "column",
        animation: "dcc-slide var(--dur-med) var(--ease-out)",
      }}
    >
      <style>
        {
          "@keyframes dcc-slide{from{transform:translateX(24px);opacity:0}to{transform:none;opacity:1}}"
        }
      </style>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 12px",
          borderBottom: "1px solid var(--border-1)",
        }}
      >
        <code style={{ fontSize: "var(--fs-base)", fontWeight: 600 }}>
          {pod.name}
        </code>
        <StatusBadge status={pod.status}>{pod.label}</StatusBadge>
        <span style={{ flex: 1 }}></span>
        <IconButton label="Close" onClick={onClose}>
          ✕
        </IconButton>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "4px 12px 12px" }}>
        <div style={sec}>Identity</div>
        <UriChip uri="pod://qa/checkout/checkout-6df4cbf8b" />
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
          <Tag>qa</Tag>
          <Tag>shared</Tag>
          <Tag>k8s-qa</Tag>
        </div>
        <div style={sec}>Recent events</div>
        <pre
          style={{
            margin: 0,
            fontFamily: "var(--font-mono)",
            fontSize: "var(--fs-xs)",
            lineHeight: "var(--lh-log)",
            color: "var(--text-2)",
          }}
        >
          <div>
            14:33{" "}
            <span style={{ color: "var(--status-failing)" }}>BackOff</span>{" "}
            restarting failed container
          </div>
          <div>14:32 Pulled image checkout:3.7.12</div>
          <div>
            14:32{" "}
            <span style={{ color: "var(--status-failing)" }}>Unhealthy</span>{" "}
            liveness probe failed: 500
          </div>
        </pre>
        <div style={sec}>Env vars (values masked)</div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
            fontFamily: "var(--font-mono)",
            fontSize: "var(--fs-xs)",
          }}
        >
          {["DATABASE_URL", "PRICING_BASE_URL", "CHECKOUT_QA_TOKEN"].map(
            (v) => (
              <div key={v}>
                <span style={{ color: "var(--syn-key)" }}>{v}</span>
                <span style={{ color: "var(--text-3)" }}>=••••••••</span>
              </div>
            ),
          )}
        </div>
        <div style={{ ...sec, display: "flex", alignItems: "center", gap: 10 }}>
          Log tail <Switch checked={true} label="" />
        </div>
        <pre
          style={{
            margin: 0,
            background: "var(--bg-0)",
            border: "1px solid var(--border-1)",
            borderRadius: "var(--radius-1)",
            padding: "8px 10px",
            fontFamily: "var(--font-mono)",
            fontSize: "var(--fs-xs)",
            lineHeight: "var(--lh-log)",
            color: "var(--text-2)",
            overflow: "auto",
            maxHeight: 130,
          }}
        >
          {D.logs.slice(0, 4).map((l, i) => (
            <div key={i}>
              <span style={{ color: "var(--text-3)" }}>{l.t}</span>{" "}
              <span
                style={{
                  color:
                    l.lvl === "ERROR"
                      ? "var(--status-failing)"
                      : l.lvl === "WARN"
                        ? "var(--status-degraded)"
                        : "var(--text-2)",
                }}
              >
                {l.lvl}
              </span>{" "}
              {l.msg}
            </div>
          ))}
        </pre>
      </div>
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: "10px 12px",
          borderTop: "1px solid var(--border-1)",
        }}
      >
        <Button variant="primary" size="sm" onClick={onRestart}>
          ⚡ Restart workload
        </Button>
        <Button size="sm">View manifest</Button>
        <span style={{ flex: 1 }}></span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--fs-2xs)",
            color: "var(--text-3)",
            alignSelf: "center",
          }}
        >
          as of 3s ago
        </span>
      </div>
    </div>
  );
}
Object.assign(window, { PodDrawer });
