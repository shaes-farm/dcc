/** Checkbox with label — filters, settings toggles that persist to config. */
export interface CheckboxProps {
  checked?: boolean;
  onChange?: (next: boolean) => void;
  label?: React.ReactNode;
  disabled?: boolean;
}
export declare function Checkbox(props: CheckboxProps): JSX.Element;
