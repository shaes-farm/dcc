/** On/off switch — live behaviors (polling, follow logs, actions kill switch). */
export interface SwitchProps {
  checked?: boolean;
  onChange?: (next: boolean) => void;
  label?: React.ReactNode;
  disabled?: boolean;
}
export declare function Switch(props: SwitchProps): JSX.Element;
