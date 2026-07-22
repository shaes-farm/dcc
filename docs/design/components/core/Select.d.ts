/** Native select styled for DCC — environment pickers, filters, reference pickers. */
export interface SelectProps {
  options: Array<string | { value: string; label: string }>;
  /** Monospace values (environments, kube contexts). */
  mono?: boolean;
  value?: string;
  onChange?: (e: any) => void;
}
export declare function Select(props: SelectProps): JSX.Element;
