import type { IsoDateTime } from "./common";
import type { Uri } from "./uri";

/**
 * The Knowledge stage (spec §3.0, §6.5).
 *
 * A `Document` is not "documentation as a feature" — it is a first-class node
 * linkable to anything, which is why the on-call engineer reaches the runbook
 * from the Context panel rather than from a wiki search. v1 sources documents
 * from repo markdown; Notion, Confluence, and the rest are later
 * `KnowledgeProvider` implementations emitting this same shape.
 */

/**
 * What kind of knowledge a document holds. Classified from path and
 * frontmatter heuristics in v1 (`docs/adr/*` → `adr`, `runbooks/*` →
 * `runbook`), falling back to `note` rather than guessing.
 */
export const DOCUMENT_KINDS = [
  "adr",
  "rfc",
  "runbook",
  "incident",
  "playbook",
  "readme",
  "design",
  "note",
] as const;

export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

export interface Document {
  uri: Uri;
  title: string;
  kind: DocumentKind;
  /** Markdown body, normalized by the provider. */
  body: string;
  /** `repo` URI the document was discovered in. */
  repo?: Uri;
  /** Path within its source, e.g. `docs/adr/0017-extract-pricing.md`. */
  path?: string;
  /** `service` URIs this document explains (§4.2 step 6). */
  services: Uri[];
  updatedAt?: IsoDateTime;
  /**
   * `doc` URIs this document cross-links to, extracted from its markdown
   * links. Doc→doc edges are how a runbook leads to the ADR behind it.
   */
  links: Uri[];
  /** Upstream URL, for "open in GitHub". */
  url?: string;
}
