import type { Uri } from "@/lib/domain";
import { cn } from "@/lib/utils";

/**
 * A resource URI, rendered (spec §3.2).
 *
 * Monospace, with the scheme in the accent colour — the design system's
 * `UriChip` (docs/design/components/status/UriChip.d.ts). This is the plain
 * version: the theme tokens it wants land with the left rail and dark theme
 * (https://github.com/shaes-farm/dcc/issues/15), which is also when this
 * should pick up the kit's exact treatment rather than approximate it twice.
 */
export function UriChip({ uri, className }: { uri: Uri; className?: string }) {
  const separator = uri.indexOf("://");
  const scheme = uri.slice(0, separator);
  const body = uri.slice(separator);

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-baseline gap-px truncate rounded border border-border bg-muted/40 px-1.5 py-0.5 font-mono text-xs",
        className,
      )}
    >
      <span className="text-primary">{scheme}</span>
      <span className="text-muted-foreground">{body}</span>
    </span>
  );
}
