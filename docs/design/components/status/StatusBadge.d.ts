/** Glyph + label status pill. Colorblind-safe: glyph always accompanies color. */
export interface StatusBadgeProps {
  status?: "healthy" | "degraded" | "failing" | "deploying" | "unknown";
  /** Label override; defaults to the status word ("CrashLoopBackOff", "2 critical"). */
  children?: React.ReactNode;
}
export declare function StatusBadge(props: StatusBadgeProps): JSX.Element;
