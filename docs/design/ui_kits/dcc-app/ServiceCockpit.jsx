const {
  Panel,
  StatusBadge,
  StatusDot,
  Button,
  IconButton,
  UriChip,
  Tag,
  ErrorCard,
} = window.DCCDesignSystem_28b72e;
function LineageStrip() {
  const node = (children) => (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "var(--bg-2)",
        border: "1px solid var(--border-1)",
        borderRadius: "var(--radius-1)",
        padding: "4px 9px",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
  const arr = <span style={{ color: "var(--text-3)" }}>→</span>;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        background: "var(--bg-1)",
        border: "1px solid var(--border-1)",
        borderRadius: "var(--radius-2)",
        fontFamily: "var(--font-mono)",
        fontSize: "var(--fs-sm)",
        overflowX: "auto",
      }}
    >
      <span
        style={{
          fontSize: "var(--fs-2xs)",
          color: "var(--text-3)",
          textTransform: "uppercase",
          letterSpacing: "var(--tracking-overline)",
          fontFamily: "var(--font-ui)",
          flex: "0 0 auto",
        }}
      >
        Lineage
      </span>
      {node(
        <React.Fragment>
          PR #248{" "}
          <span style={{ color: "var(--text-3)" }}>merged 2h · @alice</span>
        </React.Fragment>,
      )}
      {arr}
      {node(
        <React.Fragment>
          Build #1842 <span style={{ color: "var(--status-healthy)" }}>✓</span>
        </React.Fragment>,
      )}
      {arr}
      {node(
        <React.Fragment>
          checkout:3.7.12{" "}
          <span style={{ color: "var(--text-3)" }}>sha256:4bf9…</span>
        </React.Fragment>,
      )}
      {arr}
      {node(
        <React.Fragment>
          qa <span style={{ color: "var(--status-healthy)" }}>✓</span>
        </React.Fragment>,
      )}
      {node(
        <React.Fragment>
          staging <span style={{ color: "var(--status-healthy)" }}>✓</span>
        </React.Fragment>,
      )}
      {node(
        <React.Fragment>
          prod <span style={{ color: "var(--status-deploying)" }}>⏳</span>
        </React.Fragment>,
      )}
    </div>
  );
}
function ContextPanel() {
  const D = window.DCC_DATA;
  return (
    <Panel title="Context" asOf="20s ago" pad={false}>
      {D.context.map(([k, v, uri, prov]) => (
        <div
          key={k}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 10px",
            borderBottom: "1px solid var(--border-1)",
          }}
          title={`provenance: ${prov} · ${uri}`}
        >
          <span
            style={{
              fontSize: "var(--fs-xs)",
              color: "var(--text-3)",
              width: 78,
              flex: "0 0 auto",
            }}
          >
            {k}
          </span>
          <a
            style={{
              fontSize: "var(--fs-sm)",
              color: "var(--text-1)",
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              cursor: "pointer",
            }}
          >
            {v}
          </a>
          <Tag>{prov}</Tag>
        </div>
      ))}
    </Panel>
  );
}
function ServiceCockpit({ onOpenPod, onRestart }) {
  const D = window.DCC_DATA;
  const th = {
    fontSize: "var(--fs-2xs)",
    color: "var(--text-3)",
    textTransform: "uppercase",
    letterSpacing: "var(--tracking-overline)",
    textAlign: "left",
    fontWeight: 500,
    padding: "5px 10px",
    borderBottom: "1px solid var(--border-1)",
    background: "var(--bg-2)",
  };
  const td = {
    padding: "6px 10px",
    borderBottom: "1px solid var(--border-1)",
    fontSize: "var(--fs-sm)",
  };
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: 16,
        overflow: "auto",
        height: "100%",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: "var(--fs-xl)", fontWeight: 600 }}>
          Checkout Service
        </span>
        <StatusBadge status="failing">degraded · qa</StatusBadge>
        <UriChip uri="service://checkout" />
        <span style={{ flex: 1 }}></span>
        <Button variant="primary" size="sm" onClick={onRestart}>
          ⚡ Restart workload
        </Button>
        <Button size="sm">Re-run failed checks</Button>
      </div>
      <LineageStrip />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 1.3fr 1fr",
          gridTemplateRows: "auto auto",
          gap: 12,
          alignItems: "stretch",
        }}
      >
        <Panel
          title="Repository · checkout-svc"
          asOf="38s ago"
          pad={false}
          actions={<IconButton label="Refresh">⟳</IconButton>}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>PR</th>
                <th style={th}>checks</th>
                <th style={th}>age</th>
              </tr>
            </thead>
            <tbody>
              {D.prs.map((p) => (
                <tr key={p.n}>
                  <td style={td}>
                    <a style={{ cursor: "pointer" }}>#{p.n}</a>{" "}
                    <span style={{ color: "var(--text-2)" }}>{p.title}</span>
                    <br />
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--fs-2xs)",
                        color: "var(--text-3)",
                      }}
                    >
                      {p.state} · {p.author}
                    </span>
                  </td>
                  <td style={td}>
                    <StatusBadge status={p.checks} />
                  </td>
                  <td
                    style={{
                      ...td,
                      fontFamily: "var(--font-mono)",
                      color: "var(--text-3)",
                    }}
                  >
                    {p.age}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel
          title="Pods (qa)"
          asOf="8s ago"
          pad={false}
          actions={<IconButton label="Refresh">⟳</IconButton>}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>pod</th>
                <th style={th}>phase</th>
                <th style={th}>restarts</th>
                <th style={th}>age</th>
              </tr>
            </thead>
            <tbody>
              {D.pods.map((p) => (
                <tr
                  key={p.name}
                  onClick={() => onOpenPod(p)}
                  style={{
                    cursor: "pointer",
                    background:
                      p.status === "failing"
                        ? "var(--status-failing-dim)"
                        : "transparent",
                  }}
                >
                  <td style={{ ...td, fontFamily: "var(--font-mono)" }}>
                    {p.name}
                  </td>
                  <td style={td}>
                    <span style={{ color: `var(--status-${p.status})` }}>
                      {p.status === "failing" ? "⛔" : "✓"} {p.label}
                    </span>
                  </td>
                  <td
                    style={{
                      ...td,
                      fontFamily: "var(--font-mono)",
                      color:
                        p.restarts > 3
                          ? "var(--status-failing)"
                          : "var(--text-3)",
                    }}
                  >
                    {p.restarts}
                  </td>
                  <td
                    style={{
                      ...td,
                      fontFamily: "var(--font-mono)",
                      color: "var(--text-3)",
                    }}
                  >
                    {p.age}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div
            style={{
              padding: "6px 10px",
              fontSize: "var(--fs-2xs)",
              color: "var(--text-3)",
              fontFamily: "var(--font-mono)",
            }}
          >
            crash-looping pods float to the top
          </div>
        </Panel>
        <Panel title="Health & Metrics" asOf="15s ago">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              fontFamily: "var(--font-mono)",
              fontSize: "var(--fs-sm)",
            }}
          >
            <div>
              hc{" "}
              <span style={{ color: "var(--status-failing)" }}>⛔ 2140ms</span>
            </div>
            <div>
              err <span style={{ color: "var(--status-failing)" }}>2.3% ↑</span>{" "}
              <span style={{ color: "var(--text-3)" }}>(was 0.2%)</span>
            </div>
            <div>
              p95 <span style={{ color: "var(--status-degraded)" }}>480ms</span>{" "}
              <span style={{ color: "var(--text-3)" }}>p50 88ms</span>
            </div>
            <svg
              width="100%"
              height="46"
              viewBox="0 0 220 46"
              preserveAspectRatio="none"
              style={{ marginTop: 4 }}
            >
              <polyline
                points="0,40 30,39 60,40 90,38 120,39 150,14 180,10 220,8"
                fill="none"
                stroke="var(--status-failing)"
                strokeWidth="1.5"
              />
              <line
                x1="150"
                y1="0"
                x2="150"
                y2="46"
                stroke="var(--status-deploying)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            </svg>
            <div
              style={{
                fontSize: "var(--fs-2xs)",
                color: "var(--status-deploying)",
              }}
            >
              ┆ deploy 14:32 · a1b2c3d
            </div>
          </div>
        </Panel>
        <Panel title="Deploys" asOf="30s ago" pad={false}>
          {D.deploys.map((d) => (
            <div
              key={d.env}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 10px",
                borderBottom: "1px solid var(--border-1)",
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-sm)",
              }}
            >
              <StatusDot status={d.status} pulse={d.status === "deploying"} />
              <span style={{ width: 56 }}>{d.env}</span>
              <span style={{ color: "var(--text-3)" }}>{d.time}</span>
              <span style={{ color: "var(--text-2)" }}>{d.sha}</span>
            </div>
          ))}
        </Panel>
        <Panel
          title="Logs (tail)"
          asOf="live"
          pad={false}
          actions={<IconButton label="Pause tail">⏸</IconButton>}
        >
          <pre
            style={{
              margin: 0,
              padding: "8px 10px",
              fontFamily: "var(--font-mono)",
              fontSize: "var(--fs-xs)",
              lineHeight: "var(--lh-log)",
              color: "var(--text-2)",
              overflow: "auto",
            }}
          >
            {D.logs.map((l, i) => (
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
        </Panel>
        <ContextPanel />
      </div>
    </div>
  );
}
Object.assign(window, { ServiceCockpit, LineageStrip, ContextPanel });
