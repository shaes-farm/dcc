/* @ds-bundle: {"format":4,"namespace":"DCCDesignSystem_28b72e","components":[{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Checkbox","sourcePath":"components/core/Checkbox.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Input","sourcePath":"components/core/Input.jsx"},{"name":"Select","sourcePath":"components/core/Select.jsx"},{"name":"Switch","sourcePath":"components/core/Switch.jsx"},{"name":"EmptyState","sourcePath":"components/panels/EmptyState.jsx"},{"name":"ErrorCard","sourcePath":"components/panels/ErrorCard.jsx"},{"name":"Panel","sourcePath":"components/panels/Panel.jsx"},{"name":"StatusBar","sourcePath":"components/panels/StatusBar.jsx"},{"name":"StatusBadge","sourcePath":"components/status/StatusBadge.jsx"},{"name":"STATUS_COLORS","sourcePath":"components/status/StatusDot.jsx"},{"name":"StatusDot","sourcePath":"components/status/StatusDot.jsx"},{"name":"Tag","sourcePath":"components/status/Tag.jsx"},{"name":"UriChip","sourcePath":"components/status/UriChip.jsx"}],"sourceHashes":{"components/core/Button.jsx":"cd447da64ba1","components/core/Checkbox.jsx":"5265ac980714","components/core/IconButton.jsx":"ea65f3f248eb","components/core/Input.jsx":"ff88f89790e3","components/core/Select.jsx":"8cdfdd2176b6","components/core/Switch.jsx":"403d02c9a344","components/panels/EmptyState.jsx":"f29708b42596","components/panels/ErrorCard.jsx":"299141886934","components/panels/Panel.jsx":"0783b4060699","components/panels/StatusBar.jsx":"5fe2dbac7d0b","components/status/StatusBadge.jsx":"e03a49c1ac76","components/status/StatusDot.jsx":"f4b1770c1f6b","components/status/Tag.jsx":"4b551bc0c8d5","components/status/UriChip.jsx":"66e824d3a61b","ui_kits/dcc-app/App.jsx":"abe604d1bc5e","ui_kits/dcc-app/Palette.jsx":"9b8ba6d5c09d","ui_kits/dcc-app/PodDrawer.jsx":"a9ec2d935370","ui_kits/dcc-app/ServiceCockpit.jsx":"66121655985c","ui_kits/dcc-app/WorkspaceHealth.jsx":"b8f31b972ac3","ui_kits/dcc-app/data.js":"907c501fcb4d"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.DCCDesignSystem_28b72e = window.DCCDesignSystem_28b72e || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const V = {
  primary: {
    background: "var(--accent)",
    color: "var(--accent-fg)",
    border: "1px solid transparent"
  },
  secondary: {
    background: "var(--bg-3)",
    color: "var(--text-1)",
    border: "1px solid var(--border-2)"
  },
  ghost: {
    background: "transparent",
    color: "var(--text-2)",
    border: "1px solid transparent"
  },
  danger: {
    background: "var(--status-failing-dim)",
    color: "var(--status-failing)",
    border: "1px solid rgba(248,81,73,.35)"
  }
};
function Button({
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
    if (variant === "primary") bg = press ? "var(--accent-press)" : "var(--accent-hover)";else if (variant === "ghost") {
      bg = "var(--bg-2)";
      color = "var(--text-1)";
    } else if (variant === "danger") bg = "rgba(248,81,73,.24)";else bg = press ? "var(--bg-2)" : "#222D3B";
  }
  return /*#__PURE__*/React.createElement("button", _extends({
    disabled: disabled,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setPress(false);
    },
    onMouseDown: () => setPress(true),
    onMouseUp: () => setPress(false),
    style: {
      ...base,
      background: bg,
      color,
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      height: size === "sm" ? 24 : size === "lg" ? "var(--control-h-lg)" : "var(--control-h)",
      padding: size === "sm" ? "0 8px" : "0 12px",
      borderRadius: "var(--radius-1)",
      fontFamily: "var(--font-ui)",
      fontSize: size === "sm" ? "var(--fs-sm)" : "var(--fs-base)",
      fontWeight: 500,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? .45 : 1,
      transition: "background var(--dur-fast) var(--ease-out),color var(--dur-fast) var(--ease-out)",
      whiteSpace: "nowrap",
      ...style
    }
  }, rest), icon ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      fontSize: "1em",
      lineHeight: 1
    }
  }, icon) : null, children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Checkbox.jsx
try { (() => {
function Checkbox({
  checked,
  onChange,
  label,
  disabled
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? .45 : 1,
      fontSize: "var(--fs-base)",
      color: "var(--text-1)",
      userSelect: "none"
    }
  }, /*#__PURE__*/React.createElement("span", {
    onClick: () => !disabled && onChange && onChange(!checked),
    role: "checkbox",
    "aria-checked": !!checked,
    style: {
      width: 15,
      height: 15,
      flex: "0 0 auto",
      borderRadius: 3,
      border: `1px solid ${checked ? "var(--accent)" : "var(--border-2)"}`,
      background: checked ? "var(--accent)" : "var(--surface-input)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      color: "var(--accent-fg)",
      fontSize: 11,
      fontWeight: 700,
      lineHeight: 1,
      transition: "background var(--dur-fast) var(--ease-out),border-color var(--dur-fast) var(--ease-out)"
    }
  }, checked ? "✓" : ""), label);
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function IconButton({
  label,
  children,
  active,
  disabled,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", _extends({
    "aria-label": label,
    title: label,
    disabled: disabled,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "var(--control-h)",
      height: "var(--control-h)",
      borderRadius: "var(--radius-1)",
      border: "1px solid transparent",
      background: active ? "var(--accent-dim)" : hover && !disabled ? "var(--bg-3)" : "transparent",
      color: active ? "var(--accent)" : hover && !disabled ? "var(--text-1)" : "var(--text-2)",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? .45 : 1,
      fontSize: 14,
      lineHeight: 1,
      transition: "background var(--dur-fast) var(--ease-out),color var(--dur-fast) var(--ease-out)",
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Input({
  mono,
  invalid,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  return /*#__PURE__*/React.createElement("input", _extends({
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      height: "var(--control-h)",
      boxSizing: "border-box",
      padding: "0 10px",
      background: "var(--surface-input)",
      color: "var(--text-1)",
      border: `1px solid ${invalid ? "var(--status-failing)" : focus ? "var(--accent)" : "var(--border-2)"}`,
      borderRadius: "var(--radius-1)",
      fontFamily: mono ? "var(--font-mono)" : "var(--font-ui)",
      fontSize: mono ? "var(--fs-sm)" : "var(--fs-base)",
      outline: "none",
      boxShadow: focus ? "var(--focus-ring)" : "none",
      transition: "border-color var(--dur-fast) var(--ease-out),box-shadow var(--dur-fast) var(--ease-out)",
      width: "100%"
    }
  }, rest));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Input.jsx", error: String((e && e.message) || e) }); }

// components/core/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Select({
  options = [],
  mono,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      display: "inline-block",
      width: style?.width || "auto",
      ...style
    }
  }, /*#__PURE__*/React.createElement("select", _extends({
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
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
      width: "100%"
    }
  }, rest), options.map(o => typeof o === "string" ? /*#__PURE__*/React.createElement("option", {
    key: o,
    value: o
  }, o) : /*#__PURE__*/React.createElement("option", {
    key: o.value,
    value: o.value
  }, o.label))), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      right: 9,
      top: "50%",
      transform: "translateY(-50%)",
      pointerEvents: "none",
      color: "var(--text-3)",
      fontSize: 9
    }
  }, "\u25BE"));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Select.jsx", error: String((e && e.message) || e) }); }

// components/core/Switch.jsx
try { (() => {
function Switch({
  checked,
  onChange,
  label,
  disabled
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? .45 : 1,
      fontSize: "var(--fs-base)",
      color: "var(--text-1)",
      userSelect: "none"
    }
  }, /*#__PURE__*/React.createElement("span", {
    onClick: () => !disabled && onChange && onChange(!checked),
    role: "switch",
    "aria-checked": !!checked,
    style: {
      width: 30,
      height: 16,
      flex: "0 0 auto",
      borderRadius: "var(--radius-full)",
      background: checked ? "var(--accent)" : "var(--bg-3)",
      border: `1px solid ${checked ? "var(--accent)" : "var(--border-2)"}`,
      position: "relative",
      transition: "background var(--dur-med) var(--ease-out)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: 1,
      left: checked ? 15 : 1,
      width: 12,
      height: 12,
      borderRadius: "50%",
      background: checked ? "var(--accent-fg)" : "var(--text-2)",
      transition: "left var(--dur-med) var(--ease-out),background var(--dur-med) var(--ease-out)"
    }
  })), label);
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Switch.jsx", error: String((e && e.message) || e) }); }

// components/panels/EmptyState.jsx
try { (() => {
function EmptyState({
  message,
  action
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      padding: "28px 16px",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-3)",
      fontSize: "var(--fs-base)"
    }
  }, message), action ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex"
    }
  }, action) : null);
}
Object.assign(__ds_scope, { EmptyState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/panels/EmptyState.jsx", error: String((e && e.message) || e) }); }

// components/panels/ErrorCard.jsx
try { (() => {
function ErrorCard({
  title = "Provider unreachable",
  detail,
  action
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--status-failing-dim)",
      border: "1px solid rgba(248,81,73,.3)",
      borderRadius: "var(--radius-2)",
      padding: "12px 14px",
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      color: "var(--status-failing)",
      fontWeight: 600,
      fontSize: "var(--fs-base)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, "\u26D4"), title), detail ? /*#__PURE__*/React.createElement("div", {
    style: {
      color: "var(--text-2)",
      fontSize: "var(--fs-sm)",
      fontFamily: "var(--font-mono)",
      lineHeight: "var(--lh-normal)"
    }
  }, detail) : null, action ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 2
    }
  }, action) : null);
}
Object.assign(__ds_scope, { ErrorCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/panels/ErrorCard.jsx", error: String((e && e.message) || e) }); }

// components/panels/Panel.jsx
try { (() => {
function Panel({
  title,
  asOf,
  actions,
  children,
  pad = true,
  style
}) {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: "var(--surface-panel)",
      border: "1px solid var(--border-1)",
      borderRadius: "var(--radius-2)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      minWidth: 0,
      ...style
    }
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      height: "var(--panel-header-h)",
      flex: "0 0 auto",
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "0 10px",
      borderBottom: "1px solid var(--border-1)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-base)",
      fontWeight: 600,
      color: "var(--text-1)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, title), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), asOf ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--fs-2xs)",
      color: "var(--text-3)",
      whiteSpace: "nowrap"
    }
  }, "as of ", asOf) : null, actions), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      overflow: "auto",
      padding: pad ? 10 : 0
    }
  }, children));
}
Object.assign(__ds_scope, { Panel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/panels/Panel.jsx", error: String((e && e.message) || e) }); }

// components/status/StatusBadge.jsx
try { (() => {
const M = {
  healthy: {
    glyph: "✓",
    c: "var(--status-healthy)",
    bg: "var(--status-healthy-dim)"
  },
  degraded: {
    glyph: "⚠",
    c: "var(--status-degraded)",
    bg: "var(--status-degraded-dim)"
  },
  failing: {
    glyph: "⛔",
    c: "var(--status-failing)",
    bg: "var(--status-failing-dim)"
  },
  deploying: {
    glyph: "⏳",
    c: "var(--status-deploying)",
    bg: "var(--status-deploying-dim)"
  },
  unknown: {
    glyph: "○",
    c: "var(--status-unknown)",
    bg: "var(--status-unknown-dim)"
  }
};
function StatusBadge({
  status = "unknown",
  children
}) {
  const s = M[status] || M.unknown;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      height: 18,
      padding: "0 8px",
      borderRadius: "var(--radius-full)",
      background: s.bg,
      color: s.c,
      fontFamily: "var(--font-mono)",
      fontSize: "var(--fs-xs)",
      fontWeight: 500,
      whiteSpace: "nowrap",
      lineHeight: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, s.glyph), children || status);
}
Object.assign(__ds_scope, { StatusBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/status/StatusBadge.jsx", error: String((e && e.message) || e) }); }

// components/status/StatusDot.jsx
try { (() => {
const STATUS_COLORS = {
  healthy: "var(--status-healthy)",
  degraded: "var(--status-degraded)",
  failing: "var(--status-failing)",
  deploying: "var(--status-deploying)",
  unknown: "var(--status-unknown)"
};
function StatusDot({
  status = "unknown",
  size = 8,
  pulse
}) {
  return /*#__PURE__*/React.createElement("span", {
    "aria-label": status,
    title: status,
    style: {
      display: "inline-block",
      width: size,
      height: size,
      borderRadius: "50%",
      background: STATUS_COLORS[status] || STATUS_COLORS.unknown,
      flex: "0 0 auto",
      animation: pulse && status === "deploying" ? "dcc-pulse 1.6s ease-in-out infinite" : "none"
    }
  }, /*#__PURE__*/React.createElement("style", null, "@keyframes dcc-pulse{0%,100%{opacity:1}50%{opacity:.35}}"));
}
Object.assign(__ds_scope, { STATUS_COLORS, StatusDot });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/status/StatusDot.jsx", error: String((e && e.message) || e) }); }

// components/panels/StatusBar.jsx
try { (() => {
function StatusBar({
  workspace = "Acme Commerce",
  preset = "Debugging",
  polling = true,
  issues = 0,
  clock = "14:32"
}) {
  const ok = issues === 0;
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      height: "var(--statusbar-h)",
      boxSizing: "border-box",
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "0 12px",
      background: "var(--bg-1)",
      borderTop: "1px solid var(--border-1)",
      fontFamily: "var(--font-mono)",
      fontSize: "var(--fs-xs)",
      color: "var(--text-2)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-1)",
      fontWeight: 600
    }
  }, workspace), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-3)"
    }
  }, "layout: ", preset), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.StatusDot, {
    status: polling ? "healthy" : "unknown",
    size: 6
  }), " polling ", polling ? "on" : "paused"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      color: ok ? "var(--status-healthy)" : "var(--status-degraded)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, ok ? "✓" : "⚠"), ok ? "system OK" : `${issues} issues`), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-3)"
    }
  }, clock));
}
Object.assign(__ds_scope, { StatusBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/panels/StatusBar.jsx", error: String((e && e.message) || e) }); }

// components/status/Tag.jsx
try { (() => {
function Tag({
  children,
  accent
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      height: 18,
      padding: "0 6px",
      borderRadius: "var(--radius-1)",
      background: accent ? "var(--accent-dim)" : "var(--bg-3)",
      color: accent ? "var(--accent)" : "var(--text-2)",
      border: `1px solid ${accent ? "rgba(52,198,236,.3)" : "var(--border-1)"}`,
      fontFamily: "var(--font-mono)",
      fontSize: "var(--fs-2xs)",
      lineHeight: 1,
      whiteSpace: "nowrap",
      letterSpacing: ".02em"
    }
  }, children);
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/status/Tag.jsx", error: String((e && e.message) || e) }); }

// components/status/UriChip.jsx
try { (() => {
function UriChip({
  uri,
  onClick
}) {
  const [hover, setHover] = React.useState(false);
  const i = uri.indexOf("://");
  const scheme = i > 0 ? uri.slice(0, i) : "";
  const rest = i > 0 ? uri.slice(i) : uri;
  return /*#__PURE__*/React.createElement("span", {
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    title: "Copy link \xB7 paste in palette to jump",
    style: {
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
      transition: "background var(--dur-fast) var(--ease-out)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--accent)"
    }
  }, scheme), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-2)",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, rest));
}
Object.assign(__ds_scope, { UriChip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/status/UriChip.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dcc-app/App.jsx
try { (() => {
const {
  StatusDot,
  StatusBar,
  Tag
} = window.DCCDesignSystem_28b72e;
function Rail({
  view,
  onNav,
  onPalette
}) {
  const D = window.DCC_DATA;
  const sec = {
    fontSize: "var(--fs-2xs)",
    color: "var(--text-3)",
    textTransform: "uppercase",
    letterSpacing: "var(--tracking-overline)",
    padding: "12px 12px 5px",
    fontWeight: 500
  };
  const item = active => ({
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "5px 12px",
    cursor: "pointer",
    fontSize: "var(--fs-base)",
    color: active ? "var(--text-1)" : "var(--text-2)",
    background: active ? "var(--accent-dim)" : "transparent",
    borderLeft: active ? "2px solid var(--accent)" : "2px solid transparent"
  });
  return /*#__PURE__*/React.createElement("nav", {
    style: {
      width: "var(--rail-w)",
      flex: "0 0 auto",
      background: "var(--bg-1)",
      borderRight: "1px solid var(--border-1)",
      display: "flex",
      flexDirection: "column",
      overflow: "auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: () => onNav("health"),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "12px 12px",
      borderBottom: "1px solid var(--border-1)",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontWeight: 700,
      fontSize: 15,
      letterSpacing: "-.02em"
    }
  }, "DC", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--accent)"
    }
  }, "C")), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-sm)",
      color: "var(--text-2)",
      flex: 1
    }
  }, D.workspace), /*#__PURE__*/React.createElement(StatusDot, {
    status: "failing"
  })), /*#__PURE__*/React.createElement("div", {
    onClick: onPalette,
    style: {
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
      fontSize: "var(--fs-sm)"
    }
  }, /*#__PURE__*/React.createElement("span", null, "Jump to\u2026"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("kbd", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--fs-2xs)",
      background: "var(--bg-2)",
      border: "1px solid var(--border-2)",
      borderRadius: 3,
      padding: "0 4px"
    }
  }, "\u2318K")), /*#__PURE__*/React.createElement("div", {
    onClick: () => onNav("health"),
    style: item(view === "health")
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      textAlign: "center",
      color: view === "health" ? "var(--accent)" : "var(--text-3)"
    }
  }, "\u25C9"), "Workspace Health"), /*#__PURE__*/React.createElement("div", {
    style: sec
  }, "Services"), D.services.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.id,
    onClick: () => onNav(s.id),
    style: item(view === s.id),
    onMouseEnter: e => {
      if (view !== s.id) e.currentTarget.style.background = "var(--bg-2)";
    },
    onMouseLeave: e => {
      if (view !== s.id) e.currentTarget.style.background = "transparent";
    }
  }, /*#__PURE__*/React.createElement(StatusDot, {
    status: s.status,
    size: 7
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, s.name))), /*#__PURE__*/React.createElement("div", {
    style: sec
  }, "Lenses"), D.lenses.map(l => /*#__PURE__*/React.createElement("div", {
    key: l,
    style: item(false),
    onMouseEnter: e => e.currentTarget.style.background = "var(--bg-2)",
    onMouseLeave: e => e.currentTarget.style.background = "transparent"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-sm)"
    }
  }, l))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "10px 12px",
      borderTop: "1px solid var(--border-1)",
      display: "flex",
      gap: 6,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(Tag, {
    accent: true
  }, "On-call"), /*#__PURE__*/React.createElement(Tag, null, "Debugging"), /*#__PURE__*/React.createElement(Tag, null, "Tech-lead")));
}
function App() {
  const [view, setView] = React.useState(localStorage.getItem("dcc-kit-view") || "health");
  const [palette, setPalette] = React.useState(false);
  const [pod, setPod] = React.useState(null);
  const [confirm, setConfirm] = React.useState(false);
  const nav = v => {
    setView(v);
    setPod(null);
    try {
      localStorage.setItem("dcc-kit-view", v);
    } catch (e) {}
  };
  React.useEffect(() => {
    const h = e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette(p => !p);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  const cockpit = view !== "health";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      background: "var(--bg-0)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flex: 1,
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement(Rail, {
    view: view,
    onNav: nav,
    onPalette: () => setPalette(true)
  }), /*#__PURE__*/React.createElement("main", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, cockpit ? /*#__PURE__*/React.createElement(ServiceCockpit, {
    onOpenPod: setPod,
    onRestart: () => setConfirm(true)
  }) : /*#__PURE__*/React.createElement(WorkspaceHealth, {
    onOpenService: nav
  }))), /*#__PURE__*/React.createElement(StatusBar, {
    workspace: window.DCC_DATA.workspace,
    preset: "On-call",
    polling: true,
    issues: 5,
    clock: "14:33"
  }), palette ? /*#__PURE__*/React.createElement(Palette, {
    onClose: () => setPalette(false),
    onOpenService: nav
  }) : null, pod ? /*#__PURE__*/React.createElement(PodDrawer, {
    pod: pod,
    onClose: () => setPod(null),
    onRestart: () => setConfirm(true)
  }) : null, confirm ? /*#__PURE__*/React.createElement(ConfirmDialog, {
    onClose: () => setConfirm(false)
  }) : null);
}
Object.assign(window, {
  App,
  Rail
});
// Mount only in the kit page itself — this file is also swept into _ds_bundle.js, where siblings aren't in scope and no mount should happen.
if (typeof WorkspaceHealth !== "undefined" && document.getElementById("root") && !window.__dccMounted) {
  window.__dccMounted = true;
  ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(App, null));
}
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dcc-app/App.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dcc-app/Palette.jsx
try { (() => {
const {
  StatusDot,
  UriChip,
  Tag,
  Button
} = window.DCCDesignSystem_28b72e;
function Palette({
  onClose,
  onOpenService
}) {
  const D = window.DCC_DATA;
  const [q, setQ] = React.useState("");
  const [sel, setSel] = React.useState(0);
  const inputRef = React.useRef(null);
  React.useEffect(() => {
    inputRef.current && inputRef.current.focus();
  }, []);
  const results = D.paletteIndex.filter(r => r.label.toLowerCase().includes(q.toLowerCase()));
  const pick = r => {
    if (r.kind === "service" || r.uri.includes("checkout")) onOpenService("checkout");
    onClose();
  };
  const onKey = e => {
    if (e.key === "Escape") onClose();else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel(s => Math.min(s + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel(s => Math.max(s - 1, 0));
    } else if (e.key === "Enter" && results[sel]) pick(results[sel]);
  };
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: "fixed",
      inset: 0,
      background: "var(--scrim)",
      zIndex: 50,
      display: "flex",
      justifyContent: "center",
      paddingTop: 110
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: 560,
      height: "fit-content",
      background: "var(--bg-1)",
      border: "1px solid var(--border-2)",
      borderRadius: "var(--radius-3)",
      boxShadow: "var(--shadow-overlay)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "10px 12px",
      borderBottom: "1px solid var(--border-1)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-3)",
      fontFamily: "var(--font-mono)"
    }
  }, "\u203A"), /*#__PURE__*/React.createElement("input", {
    ref: inputRef,
    value: q,
    onChange: e => {
      setQ(e.target.value);
      setSel(0);
    },
    onKeyDown: onKey,
    placeholder: "Jump to anything \u2014 or paste a URI\u2026",
    style: {
      flex: 1,
      background: "transparent",
      border: "none",
      outline: "none",
      color: "var(--text-1)",
      fontFamily: "var(--font-mono)",
      fontSize: "var(--fs-base)"
    }
  }), /*#__PURE__*/React.createElement("kbd", {
    style: {
      background: "var(--bg-3)",
      border: "1px solid var(--border-2)",
      borderRadius: 3,
      padding: "1px 5px",
      fontFamily: "var(--font-mono)",
      fontSize: "var(--fs-2xs)",
      color: "var(--text-3)"
    }
  }, "esc")), /*#__PURE__*/React.createElement("div", null, results.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "14px 12px",
      color: "var(--text-3)",
      fontSize: "var(--fs-sm)"
    }
  }, "No matches \u2014 try a service name or paste a URI") : results.map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: r.uri,
    onClick: () => pick(r),
    onMouseEnter: () => setSel(i),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      padding: "7px 12px",
      cursor: "pointer",
      background: i === sel ? "var(--accent-dim)" : "transparent",
      borderLeft: i === sel ? "2px solid var(--accent)" : "2px solid transparent"
    }
  }, r.dot ? /*#__PURE__*/React.createElement(StatusDot, {
    status: r.dot,
    size: 7
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      width: 7
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-base)",
      color: r.kind === "action" ? "var(--accent)" : "var(--text-1)",
      flex: 1,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, r.label), /*#__PURE__*/React.createElement(Tag, null, r.kind)))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "6px 12px",
      borderTop: "1px solid var(--border-1)",
      fontFamily: "var(--font-mono)",
      fontSize: "var(--fs-2xs)",
      color: "var(--text-3)",
      display: "flex",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", null, "\u2191\u2193 navigate"), /*#__PURE__*/React.createElement("span", null, "\u21B5 open"), /*#__PURE__*/React.createElement("span", null, "actions confirm before running"))));
}
function ConfirmDialog({
  onClose
}) {
  const [typed, setTyped] = React.useState("");
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: "fixed",
      inset: 0,
      background: "var(--scrim)",
      zIndex: 60,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: 440,
      background: "var(--bg-1)",
      border: "1px solid var(--border-2)",
      borderRadius: "var(--radius-3)",
      boxShadow: "var(--shadow-overlay)",
      padding: 16,
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-lg)",
      fontWeight: 600
    }
  }, "Restart workload?"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-base)",
      color: "var(--text-2)",
      lineHeight: "var(--lh-normal)"
    }
  }, "Rollout restart of ", /*#__PURE__*/React.createElement("code", {
    style: {
      color: "var(--text-1)"
    }
  }, "deployment/checkout"), " in ", /*#__PURE__*/React.createElement("code", {
    style: {
      color: "var(--text-1)"
    }
  }, "qa"), " ", /*#__PURE__*/React.createElement(Tag, null, "shared"), " via ", /*#__PURE__*/React.createElement("code", null, "k8s-qa"), ". Pods are never deleted directly. The action is audit-logged."), /*#__PURE__*/React.createElement(UriChip, {
    uri: "action://restartWorkload?target=workload://qa/checkout/deployment/checkout"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      justifyContent: "flex-end"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    onClick: onClose
  }, "Cancel"), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    onClick: onClose
  }, "Restart workload"))));
}
Object.assign(window, {
  Palette,
  ConfirmDialog
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dcc-app/Palette.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dcc-app/PodDrawer.jsx
try { (() => {
const {
  IconButton,
  Button,
  StatusBadge,
  UriChip,
  Tag,
  Switch
} = window.DCCDesignSystem_28b72e;
function PodDrawer({
  pod,
  onClose,
  onRestart
}) {
  const D = window.DCC_DATA;
  const sec = {
    fontSize: "var(--fs-2xs)",
    color: "var(--text-3)",
    textTransform: "uppercase",
    letterSpacing: "var(--tracking-overline)",
    margin: "10px 0 6px"
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
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
      animation: "dcc-slide var(--dur-med) var(--ease-out)"
    }
  }, /*#__PURE__*/React.createElement("style", null, "@keyframes dcc-slide{from{transform:translateX(24px);opacity:0}to{transform:none;opacity:1}}"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "10px 12px",
      borderBottom: "1px solid var(--border-1)"
    }
  }, /*#__PURE__*/React.createElement("code", {
    style: {
      fontSize: "var(--fs-base)",
      fontWeight: 600
    }
  }, pod.name), /*#__PURE__*/React.createElement(StatusBadge, {
    status: pod.status
  }, pod.label), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(IconButton, {
    label: "Close",
    onClick: onClose
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: "auto",
      padding: "4px 12px 12px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: sec
  }, "Identity"), /*#__PURE__*/React.createElement(UriChip, {
    uri: "pod://qa/checkout/checkout-6df4cbf8b"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement(Tag, null, "qa"), /*#__PURE__*/React.createElement(Tag, null, "shared"), /*#__PURE__*/React.createElement(Tag, null, "k8s-qa")), /*#__PURE__*/React.createElement("div", {
    style: sec
  }, "Recent events"), /*#__PURE__*/React.createElement("pre", {
    style: {
      margin: 0,
      fontFamily: "var(--font-mono)",
      fontSize: "var(--fs-xs)",
      lineHeight: "var(--lh-log)",
      color: "var(--text-2)"
    }
  }, /*#__PURE__*/React.createElement("div", null, "14:33 ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--status-failing)"
    }
  }, "BackOff"), "      restarting failed container"), /*#__PURE__*/React.createElement("div", null, "14:32 Pulled       image checkout:3.7.12"), /*#__PURE__*/React.createElement("div", null, "14:32 ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--status-failing)"
    }
  }, "Unhealthy"), "    liveness probe failed: 500")), /*#__PURE__*/React.createElement("div", {
    style: sec
  }, "Env vars (values masked)"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 3,
      fontFamily: "var(--font-mono)",
      fontSize: "var(--fs-xs)"
    }
  }, ["DATABASE_URL", "PRICING_BASE_URL", "CHECKOUT_QA_TOKEN"].map(v => /*#__PURE__*/React.createElement("div", {
    key: v
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--syn-key)"
    }
  }, v), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-3)"
    }
  }, "=\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022")))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...sec,
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, "Log tail ", /*#__PURE__*/React.createElement(Switch, {
    checked: true,
    label: ""
  })), /*#__PURE__*/React.createElement("pre", {
    style: {
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
      maxHeight: 130
    }
  }, D.logs.slice(0, 4).map((l, i) => /*#__PURE__*/React.createElement("div", {
    key: i
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-3)"
    }
  }, l.t), " ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: l.lvl === "ERROR" ? "var(--status-failing)" : l.lvl === "WARN" ? "var(--status-degraded)" : "var(--text-2)"
    }
  }, l.lvl), " ", l.msg)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      padding: "10px 12px",
      borderTop: "1px solid var(--border-1)"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "sm",
    onClick: onRestart
  }, "\u26A1 Restart workload"), /*#__PURE__*/React.createElement(Button, {
    size: "sm"
  }, "View manifest"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--fs-2xs)",
      color: "var(--text-3)",
      alignSelf: "center"
    }
  }, "as of 3s ago")));
}
Object.assign(window, {
  PodDrawer
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dcc-app/PodDrawer.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dcc-app/ServiceCockpit.jsx
try { (() => {
const {
  Panel,
  StatusBadge,
  StatusDot,
  Button,
  IconButton,
  UriChip,
  Tag,
  ErrorCard
} = window.DCCDesignSystem_28b72e;
function LineageStrip() {
  const node = children => /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      background: "var(--bg-2)",
      border: "1px solid var(--border-1)",
      borderRadius: "var(--radius-1)",
      padding: "4px 9px",
      whiteSpace: "nowrap"
    }
  }, children);
  const arr = /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-3)"
    }
  }, "\u2192");
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 12px",
      background: "var(--bg-1)",
      border: "1px solid var(--border-1)",
      borderRadius: "var(--radius-2)",
      fontFamily: "var(--font-mono)",
      fontSize: "var(--fs-sm)",
      overflowX: "auto"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-2xs)",
      color: "var(--text-3)",
      textTransform: "uppercase",
      letterSpacing: "var(--tracking-overline)",
      fontFamily: "var(--font-ui)",
      flex: "0 0 auto"
    }
  }, "Lineage"), node(/*#__PURE__*/React.createElement(React.Fragment, null, "PR #248 ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-3)"
    }
  }, "merged 2h \xB7 @alice"))), arr, node(/*#__PURE__*/React.createElement(React.Fragment, null, "Build #1842 ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--status-healthy)"
    }
  }, "\u2713"))), arr, node(/*#__PURE__*/React.createElement(React.Fragment, null, "checkout:3.7.12 ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-3)"
    }
  }, "sha256:4bf9\u2026"))), arr, node(/*#__PURE__*/React.createElement(React.Fragment, null, "qa ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--status-healthy)"
    }
  }, "\u2713"))), node(/*#__PURE__*/React.createElement(React.Fragment, null, "staging ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--status-healthy)"
    }
  }, "\u2713"))), node(/*#__PURE__*/React.createElement(React.Fragment, null, "prod ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--status-deploying)"
    }
  }, "\u23F3"))));
}
function ContextPanel() {
  const D = window.DCC_DATA;
  return /*#__PURE__*/React.createElement(Panel, {
    title: "Context",
    asOf: "20s ago",
    pad: false
  }, D.context.map(([k, v, uri, prov]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 10px",
      borderBottom: "1px solid var(--border-1)"
    },
    title: `provenance: ${prov} · ${uri}`
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-xs)",
      color: "var(--text-3)",
      width: 78,
      flex: "0 0 auto"
    }
  }, k), /*#__PURE__*/React.createElement("a", {
    style: {
      fontSize: "var(--fs-sm)",
      color: "var(--text-1)",
      flex: 1,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      cursor: "pointer"
    }
  }, v), /*#__PURE__*/React.createElement(Tag, null, prov))));
}
function ServiceCockpit({
  onOpenPod,
  onRestart
}) {
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
    background: "var(--bg-2)"
  };
  const td = {
    padding: "6px 10px",
    borderBottom: "1px solid var(--border-1)",
    fontSize: "var(--fs-sm)"
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12,
      padding: 16,
      overflow: "auto",
      height: "100%",
      boxSizing: "border-box"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-xl)",
      fontWeight: 600
    }
  }, "Checkout Service"), /*#__PURE__*/React.createElement(StatusBadge, {
    status: "failing"
  }, "degraded \xB7 qa"), /*#__PURE__*/React.createElement(UriChip, {
    uri: "service://checkout"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "sm",
    onClick: onRestart
  }, "\u26A1 Restart workload"), /*#__PURE__*/React.createElement(Button, {
    size: "sm"
  }, "Re-run failed checks")), /*#__PURE__*/React.createElement(LineageStrip, null), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1.1fr 1.3fr 1fr",
      gridTemplateRows: "auto auto",
      gap: 12,
      alignItems: "stretch"
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    title: "Repository \xB7 checkout-svc",
    asOf: "38s ago",
    pad: false,
    actions: /*#__PURE__*/React.createElement(IconButton, {
      label: "Refresh"
    }, "\u27F3")
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse"
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: th
  }, "PR"), /*#__PURE__*/React.createElement("th", {
    style: th
  }, "checks"), /*#__PURE__*/React.createElement("th", {
    style: th
  }, "age"))), /*#__PURE__*/React.createElement("tbody", null, D.prs.map(p => /*#__PURE__*/React.createElement("tr", {
    key: p.n
  }, /*#__PURE__*/React.createElement("td", {
    style: td
  }, /*#__PURE__*/React.createElement("a", {
    style: {
      cursor: "pointer"
    }
  }, "#", p.n), " ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-2)"
    }
  }, p.title), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--fs-2xs)",
      color: "var(--text-3)"
    }
  }, p.state, " \xB7 ", p.author)), /*#__PURE__*/React.createElement("td", {
    style: td
  }, /*#__PURE__*/React.createElement(StatusBadge, {
    status: p.checks
  })), /*#__PURE__*/React.createElement("td", {
    style: {
      ...td,
      fontFamily: "var(--font-mono)",
      color: "var(--text-3)"
    }
  }, p.age)))))), /*#__PURE__*/React.createElement(Panel, {
    title: "Pods (qa)",
    asOf: "8s ago",
    pad: false,
    actions: /*#__PURE__*/React.createElement(IconButton, {
      label: "Refresh"
    }, "\u27F3")
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse"
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: th
  }, "pod"), /*#__PURE__*/React.createElement("th", {
    style: th
  }, "phase"), /*#__PURE__*/React.createElement("th", {
    style: th
  }, "restarts"), /*#__PURE__*/React.createElement("th", {
    style: th
  }, "age"))), /*#__PURE__*/React.createElement("tbody", null, D.pods.map(p => /*#__PURE__*/React.createElement("tr", {
    key: p.name,
    onClick: () => onOpenPod(p),
    style: {
      cursor: "pointer",
      background: p.status === "failing" ? "var(--status-failing-dim)" : "transparent"
    }
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      ...td,
      fontFamily: "var(--font-mono)"
    }
  }, p.name), /*#__PURE__*/React.createElement("td", {
    style: td
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: `var(--status-${p.status})`
    }
  }, p.status === "failing" ? "⛔" : "✓", " ", p.label)), /*#__PURE__*/React.createElement("td", {
    style: {
      ...td,
      fontFamily: "var(--font-mono)",
      color: p.restarts > 3 ? "var(--status-failing)" : "var(--text-3)"
    }
  }, p.restarts), /*#__PURE__*/React.createElement("td", {
    style: {
      ...td,
      fontFamily: "var(--font-mono)",
      color: "var(--text-3)"
    }
  }, p.age))))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "6px 10px",
      fontSize: "var(--fs-2xs)",
      color: "var(--text-3)",
      fontFamily: "var(--font-mono)"
    }
  }, "crash-looping pods float to the top")), /*#__PURE__*/React.createElement(Panel, {
    title: "Health & Metrics",
    asOf: "15s ago"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      fontFamily: "var(--font-mono)",
      fontSize: "var(--fs-sm)"
    }
  }, /*#__PURE__*/React.createElement("div", null, "hc ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--status-failing)"
    }
  }, "\u26D4 2140ms")), /*#__PURE__*/React.createElement("div", null, "err ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--status-failing)"
    }
  }, "2.3% \u2191"), " ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-3)"
    }
  }, "(was 0.2%)")), /*#__PURE__*/React.createElement("div", null, "p95 ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--status-degraded)"
    }
  }, "480ms"), " ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-3)"
    }
  }, "p50 88ms")), /*#__PURE__*/React.createElement("svg", {
    width: "100%",
    height: "46",
    viewBox: "0 0 220 46",
    preserveAspectRatio: "none",
    style: {
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("polyline", {
    points: "0,40 30,39 60,40 90,38 120,39 150,14 180,10 220,8",
    fill: "none",
    stroke: "var(--status-failing)",
    strokeWidth: "1.5"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "150",
    y1: "0",
    x2: "150",
    y2: "46",
    stroke: "var(--status-deploying)",
    strokeWidth: "1",
    strokeDasharray: "3 3"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-2xs)",
      color: "var(--status-deploying)"
    }
  }, "\u2506 deploy 14:32 \xB7 a1b2c3d"))), /*#__PURE__*/React.createElement(Panel, {
    title: "Deploys",
    asOf: "30s ago",
    pad: false
  }, D.deploys.map(d => /*#__PURE__*/React.createElement("div", {
    key: d.env,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "7px 10px",
      borderBottom: "1px solid var(--border-1)",
      fontFamily: "var(--font-mono)",
      fontSize: "var(--fs-sm)"
    }
  }, /*#__PURE__*/React.createElement(StatusDot, {
    status: d.status,
    pulse: d.status === "deploying"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 56
    }
  }, d.env), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-3)"
    }
  }, d.time), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-2)"
    }
  }, d.sha)))), /*#__PURE__*/React.createElement(Panel, {
    title: "Logs (tail)",
    asOf: "live",
    pad: false,
    actions: /*#__PURE__*/React.createElement(IconButton, {
      label: "Pause tail"
    }, "\u23F8")
  }, /*#__PURE__*/React.createElement("pre", {
    style: {
      margin: 0,
      padding: "8px 10px",
      fontFamily: "var(--font-mono)",
      fontSize: "var(--fs-xs)",
      lineHeight: "var(--lh-log)",
      color: "var(--text-2)",
      overflow: "auto"
    }
  }, D.logs.map((l, i) => /*#__PURE__*/React.createElement("div", {
    key: i
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-3)"
    }
  }, l.t), " ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: l.lvl === "ERROR" ? "var(--status-failing)" : l.lvl === "WARN" ? "var(--status-degraded)" : "var(--text-2)"
    }
  }, l.lvl), " ", l.msg)))), /*#__PURE__*/React.createElement(ContextPanel, null)));
}
Object.assign(window, {
  ServiceCockpit,
  LineageStrip,
  ContextPanel
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dcc-app/ServiceCockpit.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dcc-app/WorkspaceHealth.jsx
try { (() => {
const {
  Panel,
  StatusBadge,
  StatusDot,
  Button,
  UriChip
} = window.DCCDesignSystem_28b72e;
function WorkspaceHealth({
  onOpenService
}) {
  const D = window.DCC_DATA;
  const stat = (n, f, c) => /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--fs-2xl)",
      fontWeight: 600,
      lineHeight: 1.25,
      color: c || "var(--text-1)"
    }
  }, n), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-sm)",
      color: "var(--text-2)"
    }
  }, f));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14,
      padding: 16,
      overflow: "auto",
      height: "100%",
      boxSizing: "border-box"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-xl)",
      fontWeight: 600
    }
  }, D.workspace), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      color: "var(--status-failing)",
      fontFamily: "var(--font-mono)",
      fontSize: "var(--fs-sm)"
    }
  }, /*#__PURE__*/React.createElement(StatusDot, {
    status: "failing"
  }), " 5 issues"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--fs-2xs)",
      color: "var(--text-3)"
    }
  }, "as of 4s ago")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(5,1fr)",
      gap: 12,
      padding: "14px 16px",
      background: "var(--bg-1)",
      border: "1px solid var(--border-1)",
      borderRadius: "var(--radius-2)"
    }
  }, stat("18", /*#__PURE__*/React.createElement("span", null, "services \xB7 ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--status-failing)"
    }
  }, "3 unhealthy"))), stat("23", /*#__PURE__*/React.createElement("span", null, "repositories \xB7 ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--status-failing)"
    }
  }, "4 red CI"))), stat("147", "pods · 98% healthy"), stat("11", /*#__PURE__*/React.createElement("span", null, "security alerts \xB7 ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--status-failing)"
    }
  }, "2 critical"))), stat("2", "deploys running", "var(--status-deploying)")), /*#__PURE__*/React.createElement(Panel, {
    title: "Attention needed",
    asOf: "4s ago",
    pad: false
  }, D.attention.map(a => /*#__PURE__*/React.createElement("div", {
    key: a.uri,
    onClick: () => onOpenService(a.svc),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "8px 12px",
      borderBottom: "1px solid var(--border-1)",
      cursor: "pointer"
    },
    onMouseEnter: e => e.currentTarget.style.background = "var(--bg-2)",
    onMouseLeave: e => e.currentTarget.style.background = "transparent"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: `var(--status-${a.sev})`,
      fontSize: 14,
      width: 18,
      textAlign: "center"
    }
  }, a.glyph), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 600,
      fontSize: "var(--fs-base)",
      width: 130,
      flex: "0 0 auto"
    }
  }, a.what), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--fs-sm)",
      color: "var(--text-2)",
      flex: 1,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, a.detail), /*#__PURE__*/React.createElement(UriChip, {
    uri: a.uri
  }), /*#__PURE__*/React.createElement("a", {
    style: {
      fontSize: "var(--fs-sm)",
      whiteSpace: "nowrap"
    }
  }, "\u2192 open")))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    title: "Health checks",
    asOf: "12s ago",
    pad: false
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 0
    }
  }, D.healthChecks.map(h => /*#__PURE__*/React.createElement("div", {
    key: h.name,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "7px 12px",
      borderBottom: "1px solid var(--border-1)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: h.ok ? "var(--status-healthy)" : "var(--status-failing)"
    }
  }, h.ok ? "✓" : "⛔"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-sm)",
      flex: 1
    }
  }, h.name), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--fs-xs)",
      color: h.ok ? "var(--text-3)" : "var(--status-failing)"
    }
  }, h.ms, "ms"))))), /*#__PURE__*/React.createElement(Panel, {
    title: "Deploys running",
    asOf: "9s ago",
    pad: false
  }, [["storefront", "qa", "⏳ rolling out · 2/3 pods", "deploying"], ["checkout", "prod", "⏳ BUILDING · 1m 12s", "deploying"]].map(([s, e, d, st]) => /*#__PURE__*/React.createElement("div", {
    key: s + e,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "8px 12px",
      borderBottom: "1px solid var(--border-1)"
    }
  }, /*#__PURE__*/React.createElement(StatusDot, {
    status: st,
    pulse: true
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 600,
      fontSize: "var(--fs-base)",
      width: 110
    }
  }, s), /*#__PURE__*/React.createElement("code", {
    style: {
      fontSize: "var(--fs-xs)",
      color: "var(--text-3)"
    }
  }, e), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--fs-sm)",
      color: "var(--status-deploying)",
      flex: 1
    }
  }, d))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "8px 12px"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm"
  }, "View all deploys")))));
}
Object.assign(window, {
  WorkspaceHealth
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dcc-app/WorkspaceHealth.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dcc-app/data.js
try { (() => {
window.DCC_DATA = {
  workspace: "Acme Commerce",
  services: [{
    id: "storefront",
    name: "Storefront",
    status: "degraded"
  }, {
    id: "checkout",
    name: "Checkout Service",
    status: "failing"
  }, {
    id: "catalog",
    name: "Catalog",
    status: "healthy"
  }, {
    id: "pricing",
    name: "Pricing",
    status: "healthy"
  }, {
    id: "ui-kit",
    name: "UI Library",
    status: "degraded"
  }, {
    id: "img-resizer",
    name: "Image Resizer",
    status: "healthy"
  }],
  lenses: ["Repos & PRs", "Workflow runs", "Security", "Environments", "Observability", "APIs", "Documents", "Audit log"],
  attention: [{
    sev: "failing",
    glyph: "⛔",
    what: "checkout · qa",
    detail: "CrashLoopBackOff (restarts: 7)",
    uri: "pod://qa/checkout/checkout-6df4cbf8b",
    svc: "checkout"
  }, {
    sev: "degraded",
    glyph: "⚠",
    what: "storefront",
    detail: "p95 latency +240% since deploy 14:32",
    uri: "dashboard://grafana/uid-latency",
    svc: "storefront"
  }, {
    sev: "degraded",
    glyph: "⚠",
    what: "ui-kit",
    detail: "CodeQL critical: prototype pollution",
    uri: "alert://github/codeql/1234",
    svc: "ui-kit"
  }],
  healthChecks: [{
    name: "Storefront",
    ms: 82,
    ok: true
  }, {
    name: "Checkout",
    ms: 2140,
    ok: false
  }, {
    name: "Catalog",
    ms: 64,
    ok: true
  }, {
    name: "Pricing",
    ms: 71,
    ok: true
  }, {
    name: "GraphQL",
    ms: 120,
    ok: true
  }, {
    name: "Image Resizer",
    ms: 38,
    ok: true
  }],
  pods: [{
    name: "checkout-6df4cbf8b",
    status: "failing",
    label: "CrashLoopBackOff",
    restarts: 7,
    age: "22m",
    image: "checkout:3.7.12"
  }, {
    name: "checkout-91ab22c1",
    status: "healthy",
    label: "Running",
    restarts: 0,
    age: "2d",
    image: "checkout:3.7.12"
  }],
  prs: [{
    n: 482,
    title: "Extract pricing client",
    state: "merged",
    age: "2h",
    author: "@jdoe",
    checks: "healthy"
  }, {
    n: 483,
    title: "Retry budget for PricingClient",
    state: "open",
    age: "41m",
    author: "@alice",
    checks: "failing"
  }, {
    n: 479,
    title: "Bump openapi-parser to 4.2",
    state: "open",
    age: "2d",
    author: "@dependabot",
    checks: "healthy"
  }],
  deploys: [{
    env: "qa",
    time: "14:32",
    sha: "a1b2c3d",
    status: "healthy"
  }, {
    env: "staging",
    time: "13:05",
    sha: "a1b2c3d",
    status: "healthy"
  }, {
    env: "prod",
    time: "—",
    sha: "9f8e7d6",
    status: "deploying"
  }],
  logs: [{
    t: "14:33:02.114",
    lvl: "ERROR",
    msg: '"route": "POST /orders", "status": 500, "trace_id": "4bf92f35"'
  }, {
    t: "14:33:02.298",
    lvl: "WARN",
    msg: "PricingClient retry 3/3 — NPE in PricingClient"
  }, {
    t: "14:33:04.001",
    lvl: "INFO",
    msg: '"p95_ms": 480, "error_rate": 0.047'
  }, {
    t: "14:33:05.512",
    lvl: "ERROR",
    msg: '"route": "POST /orders", "status": 500, "trace_id": "8ca01d22"'
  }, {
    t: "14:33:07.090",
    lvl: "INFO",
    msg: "health probe ok in 12ms"
  }],
  paletteIndex: [{
    label: "Checkout Service",
    kind: "service",
    uri: "service://checkout",
    dot: "failing"
  }, {
    label: "Pods · qa",
    kind: "panel",
    uri: "pods://qa/checkout"
  }, {
    label: "Logs · qa",
    kind: "panel",
    uri: "logs://loki?service=checkout&env=qa"
  }, {
    label: "Metrics (err/p95)",
    kind: "panel",
    uri: "dashboard://grafana/uid-errors"
  }, {
    label: "Repo · checkout-svc",
    kind: "repo",
    uri: "repo://github/acme/checkout-svc"
  }, {
    label: "⚡ Restart workload checkout @ qa",
    kind: "action",
    uri: "action://restartWorkload?target=workload://qa/checkout/deployment/checkout"
  }, {
    label: "OpenAPI explorer",
    kind: "panel",
    uri: "api://checkout/rest"
  }, {
    label: "Deploy history",
    kind: "panel",
    uri: "deploy://qa/checkout"
  }, {
    label: "PRs (3 open)",
    kind: "panel",
    uri: "pr://github/acme/checkout-svc"
  }],
  context: [["Repository", "checkout-svc (CI ✓, 3 PRs)", "repo://github/acme/checkout-svc", "declared"], ["Deployments", "qa (14:32, a1b2c3d) · staging", "deploy://qa/checkout/2026-07-21T14.32", "inferred"], ["Artifact", "checkout:3.7.12 · Build #1842", "artifact://ghcr/acme/checkout@sha256:4bf9", "inferred"], ["Security", "3 CodeQL alerts", "alert://github/codeql", "inferred"], ["Documents", "ADR-0017 · Runbook: checkout on-call", "doc://repo-md/checkout-svc/docs/adr/0017-extract-pricing.md", "knowledge"], ["Owners", "@payments-team (CODEOWNERS)", "doc://repo-md/checkout-svc/CODEOWNERS", "knowledge"], ["Depends on", "catalog", "service://catalog", "telemetry"]]
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dcc-app/data.js", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.ErrorCard = __ds_scope.ErrorCard;

__ds_ns.Panel = __ds_scope.Panel;

__ds_ns.StatusBar = __ds_scope.StatusBar;

__ds_ns.StatusBadge = __ds_scope.StatusBadge;

__ds_ns.STATUS_COLORS = __ds_scope.STATUS_COLORS;

__ds_ns.StatusDot = __ds_scope.StatusDot;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.UriChip = __ds_scope.UriChip;

})();
