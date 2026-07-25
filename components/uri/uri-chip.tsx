import type { Uri } from "@/lib/domain";
import { cn } from "@/lib/utils";

/**
 * A resource URI, rendered (spec §3.2,
 * `docs/design/components/status/UriChip.prompt.md`).
 *
 * Monospace, scheme in the accent color, everywhere an object reference is
 * shown — Context panel rows, lineage nodes, correlation threads, rail rows.
 * §3.2's rule is that everything rendered carries its URI, so this is the
 * shape that rule takes on screen.
 *
 * Copying and navigation deliberately do not live here: `Addressable` already
 * owns right-click → Copy link, ⌘-click, and the keyboard path for *any*
 * child, so a chip that also knew how to copy itself would be a second
 * implementation of the same §3.2 promise. Wrap this in `Addressable` instead.
 */
export function UriChip({ uri, className }: { uri: Uri; className?: string }) {
  const separator = uri.indexOf("://");
  const scheme = uri.slice(0, separator);
  const rest = uri.slice(separator);

  return (
    <span
      className={cn(
        "border-hairline bg-raised text-label hover:border-hairline-strong hover:bg-inset inline-flex h-5 max-w-full items-center overflow-hidden rounded-sm border px-1.75 font-mono text-xs whitespace-nowrap transition-colors",
        className,
      )}
    >
      <span className="text-accent-strong">{scheme}</span>
      <span className="truncate">{rest}</span>
    </span>
  );
}
