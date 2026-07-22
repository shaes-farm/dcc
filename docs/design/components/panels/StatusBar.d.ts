/** Persistent bottom workspace status bar (§7.2): workspace, layout preset, polling, issues beacon, clock. */
export interface StatusBarProps {
  workspace?: string;
  preset?: string;
  polling?: boolean;
  /** 0 renders "✓ system OK". */
  issues?: number;
  /** 24h clock string, e.g. "14:32". */
  clock?: string;
}
export declare function StatusBar(props: StatusBarProps): JSX.Element;
