/** Text input. Set `mono` for URLs, tokens, env-var names, URIs, LogQL. */
export interface InputProps {
  /** JetBrains Mono at 12px — identifiers, URLs, queries. */
  mono?: boolean;
  /** Red border — pair with an actionable message nearby. */
  invalid?: boolean;
  placeholder?: string;
  value?: string;
  onChange?: (e: any) => void;
  type?: string;
}
export declare function Input(props: InputProps): JSX.Element;
