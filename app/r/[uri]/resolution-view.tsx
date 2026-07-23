import { Addressable } from "@/components/uri/addressable";
import { UriChip } from "@/components/uri/uri-chip";
import type { Resolution } from "@/lib/routing";

/**
 * What a URI resolved to — a placeholder for the panel itself.
 *
 * The slot engine (https://github.com/shaes-farm/dcc/issues/12) mounts the
 * real panel here, and the cockpit (#13) fills the first one. Until then this
 * shows the resolution rather than a blank page, which is what makes the
 * routing layer testable by hand: paste a URI, see which panel it opens and
 * with what parameters.
 */
export function ResolutionView({ resolution }: { resolution: Resolution }) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-16">
      <div className="flex flex-col gap-2">
        <span className="text-xs tracking-wide text-muted-foreground uppercase">
          {resolution.kind === "panel" ? "Panel" : "Action"}
        </span>
        <Addressable uri={resolution.uri}>
          <UriChip uri={resolution.uri} />
        </Addressable>
      </div>

      {resolution.kind === "panel" ? (
        <Rows
          rows={[
            ["panel", resolution.panel],
            ...Object.entries(resolution.params)
              .filter(([key]) => key !== "scheme")
              .map(([key, value]): [string, string] => [key, String(value)]),
          ]}
        />
      ) : (
        <>
          <Rows
            rows={[
              ["action", resolution.actionId],
              ["target", resolution.target],
            ]}
          />
          <p className="max-w-prose text-sm text-muted-foreground">
            Actions open a confirmation dialog, never a view — nothing runs
            straight off a link (§7.1).
          </p>
        </>
      )}

      <p className="max-w-prose text-sm text-muted-foreground">
        The panel itself arrives with the slot engine. This page is the routing
        layer showing its work.
      </p>
    </main>
  );
}

function Rows({ rows }: { rows: Array<[label: string, value: string]> }) {
  return (
    <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 border-t border-border pt-4 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="font-mono text-xs text-muted-foreground">{label}</dt>
          <dd className="font-mono text-xs break-all">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
