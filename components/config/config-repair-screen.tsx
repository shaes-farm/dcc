import type { ConfigIssue, ConfigLoadError } from "@/lib/config/load";

/**
 * The config-repair screen (spec §4.3, #8) — rendered, not thrown, the same
 * way `app/r/[uri]/unresolvable-uri.tsx` renders a bad deep link rather than
 * letting it become a stack trace. `app/layout.tsx` calls `safeLoadConfig()`
 * on every request and renders this in place of the app shell when it fails,
 * so a broken `dcc.config.json` degrades to this screen instead of a crash
 * or a blank page, on every route.
 *
 * Follows the design system's `ErrorCard` contract (actionable mono detail,
 * status color paired with a glyph) using the app's existing `destructive`
 * Tailwind tokens — the same ones `UnresolvableUri` already uses, so this
 * introduces no new CSS.
 *
 * Settings (#69) doesn't exist yet, so "link to the relevant settings
 * section" (§4.3's own wording: "once §4.3 forms exist") isn't possible
 * today — issues show their location instead, and the closing note says so
 * rather than shipping a link to nowhere.
 */
export function ConfigRepairScreen({ error }: { error: ConfigLoadError }) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-start gap-4 overflow-auto p-16">
      <div className="flex items-center gap-2 text-destructive">
        <span aria-hidden="true">⛔</span>
        <h1 className="font-heading text-xl font-semibold tracking-tight">
          Config needs attention
        </h1>
      </div>

      <p className="max-w-prose text-sm text-muted-foreground">
        <code className="font-mono text-xs break-all">{error.configPath}</code>{" "}
        did not pass validation. Fix the issues below, then reload.
      </p>

      <ul className="flex w-full flex-col gap-2">
        {error.issues.map((issue, index) => (
          <li
            key={index}
            className="flex flex-col gap-1 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2"
          >
            <div className="font-mono text-xs text-muted-foreground">
              {formatIssueLocation(issue)}
            </div>
            <div className="font-mono text-xs break-all text-destructive">
              {issue.message}
            </div>
          </li>
        ))}
      </ul>

      <p className="text-sm text-muted-foreground">
        Settings-section links land once #69 (Settings UI) ships.
      </p>
    </main>
  );
}

/** `services[2].repository · line 8`, or just the path/line when one is missing. */
function formatIssueLocation(issue: ConfigIssue): string {
  const path = formatConfigPath(issue.path);
  return issue.line !== undefined ? `${path} · line ${issue.line}` : path;
}

/** `["services", 2, "repository"]` → `services[2].repository`. */
function formatConfigPath(path: (string | number)[]): string {
  if (path.length === 0) return "(top level)";

  return path
    .map((segment, index) =>
      typeof segment === "number"
        ? `[${segment}]`
        : index === 0
          ? segment
          : `.${segment}`,
    )
    .join("");
}
