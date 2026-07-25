import { cn } from "@/lib/utils";

/**
 * Square-cornered mono tag for taxonomy — repo tags, environment tiers
 * (`sandbox`/`shared`/`prod-like`), provider kinds, doc kinds
 * (`docs/design/components/status/Tag.prompt.md`).
 *
 * Square corners are what tells it apart from `StatusBadge`, which is the only
 * pill in the system. A tag is never a status.
 */
export function Tag({
  children,
  accent,
  className,
}: {
  children: React.ReactNode;
  /** Accent tint, for the selected or highlighted tag. */
  accent?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-4.5 items-center rounded-sm border px-1.5 font-mono text-2xs leading-none tracking-[0.02em] whitespace-nowrap",
        accent
          ? "border-accent-strong/30 bg-accent text-accent-strong"
          : "border-hairline bg-inset text-label",
        className,
      )}
    >
      {children}
    </span>
  );
}
