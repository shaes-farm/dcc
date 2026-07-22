/** Designed empty state — every panel needs one. Message points at the fix. */
export interface EmptyStateProps {
  /** e.g. "No services configured" */
  message: React.ReactNode;
  /** The fix, e.g. <Button variant="ghost">Add in Settings</Button> */
  action?: React.ReactNode;
}
export declare function EmptyState(props: EmptyStateProps): JSX.Element;
