const { StatusDot, StatusBar, Tag } = window.DCCDesignSystem_28b72e;
function Rail({ view, onNav, onPalette }) {
  const D = window.DCC_DATA;
  const sec = {
    fontSize: "var(--fs-2xs)",
    color: "var(--text-3)",
    textTransform: "uppercase",
    letterSpacing: "var(--tracking-overline)",
    padding: "12px 12px 5px",
    fontWeight: 500,
  };
  const item = (active) => ({
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "5px 12px",
    cursor: "pointer",
    fontSize: "var(--fs-base)",
    color: active ? "var(--text-1)" : "var(--text-2)",
    background: active ? "var(--accent-dim)" : "transparent",
    borderLeft: active ? "2px solid var(--accent)" : "2px solid transparent",
  });
  return (
    <nav
      style={{
        width: "var(--rail-w)",
        flex: "0 0 auto",
        background: "var(--bg-1)",
        borderRight: "1px solid var(--border-1)",
        display: "flex",
        flexDirection: "column",
        overflow: "auto",
      }}
    >
      <div
        onClick={() => onNav("health")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "12px 12px",
          borderBottom: "1px solid var(--border-1)",
          cursor: "pointer",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            fontSize: 15,
            letterSpacing: "-.02em",
          }}
        >
          DC<span style={{ color: "var(--accent)" }}>C</span>
        </span>
        <span
          style={{ fontSize: "var(--fs-sm)", color: "var(--text-2)", flex: 1 }}
        >
          {D.workspace}
        </span>
        <StatusDot status="failing" />
      </div>
      <div
        onClick={onPalette}
        style={{
          margin: 10,
          display: "flex",
          alignItems: "center",
          gap: 8,
          height: 26,
          padding: "0 8px",
          background: "var(--bg-3)",
          border: "1px solid var(--border-1)",
          borderRadius: "var(--radius-1)",
          cursor: "pointer",
          color: "var(--text-3)",
          fontSize: "var(--fs-sm)",
        }}
      >
        <span>Jump to…</span>
        <span style={{ flex: 1 }}></span>
        <kbd
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--fs-2xs)",
            background: "var(--bg-2)",
            border: "1px solid var(--border-2)",
            borderRadius: 3,
            padding: "0 4px",
          }}
        >
          ⌘K
        </kbd>
      </div>
      <div onClick={() => onNav("health")} style={item(view === "health")}>
        <span
          style={{
            width: 8,
            textAlign: "center",
            color: view === "health" ? "var(--accent)" : "var(--text-3)",
          }}
        >
          ◉
        </span>
        Workspace Health
      </div>
      <div style={sec}>Services</div>
      {D.services.map((s) => (
        <div
          key={s.id}
          onClick={() => onNav(s.id)}
          style={item(view === s.id)}
          onMouseEnter={(e) => {
            if (view !== s.id) e.currentTarget.style.background = "var(--bg-2)";
          }}
          onMouseLeave={(e) => {
            if (view !== s.id) e.currentTarget.style.background = "transparent";
          }}
        >
          <StatusDot status={s.status} size={7} />
          <span
            style={{
              flex: 1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {s.name}
          </span>
        </div>
      ))}
      <div style={sec}>Lenses</div>
      {D.lenses.map((l) => (
        <div
          key={l}
          style={item(false)}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--bg-2)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          <span style={{ width: 8 }}></span>
          <span style={{ fontSize: "var(--fs-sm)" }}>{l}</span>
        </div>
      ))}
      <div style={{ flex: 1 }}></div>
      <div
        style={{
          padding: "10px 12px",
          borderTop: "1px solid var(--border-1)",
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
        }}
      >
        <Tag accent>On-call</Tag>
        <Tag>Debugging</Tag>
        <Tag>Tech-lead</Tag>
      </div>
    </nav>
  );
}
function App() {
  const [view, setView] = React.useState(
    localStorage.getItem("dcc-kit-view") || "health",
  );
  const [palette, setPalette] = React.useState(false);
  const [pod, setPod] = React.useState(null);
  const [confirm, setConfirm] = React.useState(false);
  const nav = (v) => {
    setView(v);
    setPod(null);
    try {
      localStorage.setItem("dcc-kit-view", v);
    } catch (e) {}
  };
  React.useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((p) => !p);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  const cockpit = view !== "health";
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "var(--bg-0)",
      }}
    >
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <Rail view={view} onNav={nav} onPalette={() => setPalette(true)} />
        <main style={{ flex: 1, minWidth: 0 }}>
          {cockpit ? (
            <ServiceCockpit
              onOpenPod={setPod}
              onRestart={() => setConfirm(true)}
            />
          ) : (
            <WorkspaceHealth onOpenService={nav} />
          )}
        </main>
      </div>
      <StatusBar
        workspace={window.DCC_DATA.workspace}
        preset="On-call"
        polling={true}
        issues={5}
        clock="14:33"
      />
      {palette ? (
        <Palette onClose={() => setPalette(false)} onOpenService={nav} />
      ) : null}
      {pod ? (
        <PodDrawer
          pod={pod}
          onClose={() => setPod(null)}
          onRestart={() => setConfirm(true)}
        />
      ) : null}
      {confirm ? <ConfirmDialog onClose={() => setConfirm(false)} /> : null}
    </div>
  );
}
Object.assign(window, { App, Rail });
// Mount only in the kit page itself — this file is also swept into _ds_bundle.js, where siblings aren't in scope and no mount should happen.
if (
  typeof WorkspaceHealth !== "undefined" &&
  document.getElementById("root") &&
  !window.__dccMounted
) {
  window.__dccMounted = true;
  ReactDOM.createRoot(document.getElementById("root")).render(<App />);
}
