/** Small mono tag — repo tags ("library", "nextjs"), tier badges ("prod-like"), provider kinds. */
export interface TagProps {
  children: React.ReactNode;
  /** Accent tint for the selected/highlighted tag. */
  accent?: boolean;
}
export declare function Tag(props: TagProps): JSX.Element;
