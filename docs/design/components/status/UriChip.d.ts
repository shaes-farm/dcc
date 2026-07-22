/** Monospace resource-URI chip — everything rendered anywhere carries its URI (§3.2). Scheme in accent. */
export interface UriChipProps {
  /** Full resource URI, e.g. "pod://qa/checkout/checkout-6df4cbf8b". */
  uri: string;
  onClick?: () => void;
}
export declare function UriChip(props: UriChipProps): JSX.Element;
