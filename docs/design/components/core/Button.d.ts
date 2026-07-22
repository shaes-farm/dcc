/**
 * Standard DCC action button. Verb-first labels ("Restart workload").
 * @startingPoint section="Controls" subtitle="Primary, secondary, ghost and danger buttons" viewport="700x220"
 */
export interface ButtonProps {
  /** Visual weight. `primary` is the single accent action on a surface. */
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  /** Optional leading icon node (Lucide 14px or unicode glyph). */
  icon?: React.ReactNode;
  disabled?: boolean;
  children?: React.ReactNode;
  onClick?: () => void;
}
export declare function Button(props: ButtonProps): JSX.Element;
