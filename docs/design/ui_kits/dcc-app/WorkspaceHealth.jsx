const { Panel, StatusBadge, StatusDot, Button, UriChip } =
  window.DCCDesignSystem_28b72e;
function WorkspaceHealth({ onOpenService }) {
  const D = window.DCC_DATA;
  const stat = (n, f, c) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--fs-2xl)",
          fontWeight: 600,
          lineHeight: 1.25,
          color: c || "var(--text-1)",
        }}
      >
        {n}
      </span>
      <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-2)" }}>
        {f}
      </span>
    </div>
  );
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        padding: 16,
        overflow: "auto",
        height: "100%",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <span style={{ fontSize: "var(--fs-xl)", fontWeight: 600 }}>
          {D.workspace}
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "var(--status-failing)",
            fontFamily: "var(--font-mono)",
            fontSize: "var(--fs-sm)",
          }}
        >
          <StatusDot status="failing" /> 5 issues
        </span>
        <span style={{ flex: 1 }}></span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--fs-2xs)",
            color: "var(--text-3)",
          }}
        >
          as of 4s ago
        </span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5,1fr)",
          gap: 12,
          padding: "14px 16px",
          background: "var(--bg-1)",
          border: "1px solid var(--border-1)",
          borderRadius: "var(--radius-2)",
        }}
      >
        {stat(
          "18",
          <span>
            services ·{" "}
            <span style={{ color: "var(--status-failing)" }}>3 unhealthy</span>
          </span>,
        )}
        {stat(
          "23",
          <span>
            repositories ·{" "}
            <span style={{ color: "var(--status-failing)" }}>4 red CI</span>
          </span>,
        )}
        {stat("147", "pods · 98% healthy")}
        {stat(
          "11",
          <span>
            security alerts ·{" "}
            <span style={{ color: "var(--status-failing)" }}>2 critical</span>
          </span>,
        )}
        {stat("2", "deploys running", "var(--status-deploying)")}
      </div>
      <Panel title="Attention needed" asOf="4s ago" pad={false}>
        {D.attention.map((a) => (
          <div
            key={a.uri}
            onClick={() => onOpenService(a.svc)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 12px",
              borderBottom: "1px solid var(--border-1)",
              cursor: "pointer",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--bg-2)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <span
              style={{
                color: `var(--status-${a.sev})`,
                fontSize: 14,
                width: 18,
                textAlign: "center",
              }}
            >
              {a.glyph}
            </span>
            <span
              style={{
                fontWeight: 600,
                fontSize: "var(--fs-base)",
                width: 130,
                flex: "0 0 auto",
              }}
            >
              {a.what}
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-sm)",
                color: "var(--text-2)",
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {a.detail}
            </span>
            <UriChip uri={a.uri} />
            <a style={{ fontSize: "var(--fs-sm)", whiteSpace: "nowrap" }}>
              → open
            </a>
          </div>
        ))}
      </Panel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Panel title="Health checks" asOf="12s ago" pad={false}>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}
          >
            {D.healthChecks.map((h) => (
              <div
                key={h.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 12px",
                  borderBottom: "1px solid var(--border-1)",
                }}
              >
                <span
                  style={{
                    color: h.ok
                      ? "var(--status-healthy)"
                      : "var(--status-failing)",
                  }}
                >
                  {h.ok ? "✓" : "⛔"}
                </span>
                <span style={{ fontSize: "var(--fs-sm)", flex: 1 }}>
                  {h.name}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--fs-xs)",
                    color: h.ok ? "var(--text-3)" : "var(--status-failing)",
                  }}
                >
                  {h.ms}ms
                </span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Deploys running" asOf="9s ago" pad={false}>
          {[
            ["storefront", "qa", "⏳ rolling out · 2/3 pods", "deploying"],
            ["checkout", "prod", "⏳ BUILDING · 1m 12s", "deploying"],
          ].map(([s, e, d, st]) => (
            <div
              key={s + e}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px",
                borderBottom: "1px solid var(--border-1)",
              }}
            >
              <StatusDot status={st} pulse />
              <span
                style={{
                  fontWeight: 600,
                  fontSize: "var(--fs-base)",
                  width: 110,
                }}
              >
                {s}
              </span>
              <code
                style={{ fontSize: "var(--fs-xs)", color: "var(--text-3)" }}
              >
                {e}
              </code>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--fs-sm)",
                  color: "var(--status-deploying)",
                  flex: 1,
                }}
              >
                {d}
              </span>
            </div>
          ))}
          <div style={{ padding: "8px 12px" }}>
            <Button variant="ghost" size="sm">
              View all deploys
            </Button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
Object.assign(window, { WorkspaceHealth });
