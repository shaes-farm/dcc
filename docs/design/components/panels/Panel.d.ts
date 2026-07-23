/**
 * The panel — DCC's universal container. Everything ships as a panel in a grid slot.
 * @startingPoint section="Panels" subtitle="Panel shell with title, data-age stamp and actions" viewport="700x300"
 */
export interface PanelProps {
  title: React.ReactNode;
  /** Data age, e.g. "12s ago" — every panel shows freshness. */
  asOf?: string;
  /** Header-right nodes (IconButtons, Select). */
  actions?: React.ReactNode;
  /** false for tables/logs that go edge-to-edge. */
  pad?: boolean;
  children?: React.ReactNode;
}
export declare function Panel(props: PanelProps): JSX.Element;
