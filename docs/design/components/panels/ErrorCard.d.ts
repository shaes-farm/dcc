/** Inline degraded state. Panels degrade independently — the layout stands. Detail is actionable. */
export interface ErrorCardProps {
  title?: React.ReactNode;
  /** Actionable mono detail: "401 from Grafana — check GRAFANA_TOKEN in your shell" */
  detail?: React.ReactNode;
  action?: React.ReactNode;
}
export declare function ErrorCard(props: ErrorCardProps): JSX.Element;
