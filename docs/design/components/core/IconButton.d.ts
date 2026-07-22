/** Icon-only button for panel headers and toolbars (refresh, maximize, close). */
export interface IconButtonProps {
  /** Accessible label; also the tooltip. Required. */
  label: string;
  /** Icon node — Lucide 14px or a unicode glyph. */
  children: React.ReactNode;
  /** Toggled-on state (accent tint). */
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}
export declare function IconButton(props: IconButtonProps): JSX.Element;
