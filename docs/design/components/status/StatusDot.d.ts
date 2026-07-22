/** Rolled-up status dot — service rail, environment rows, workspace beacon. Normalized vocabulary only. */
export interface StatusDotProps {
  status?: "healthy" | "degraded" | "failing" | "deploying" | "unknown";
  /** Diameter px. 8 default; 6 inline; 10 headers. */
  size?: number;
  /** Slow opacity pulse while deploying. */
  pulse?: boolean;
}
export declare function StatusDot(props: StatusDotProps): JSX.Element;
