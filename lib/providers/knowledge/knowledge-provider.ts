import type { Document, Uri } from "@/lib/domain";
import type { ProviderAdapter, Scope } from "../provider";

/**
 * Engineering knowledge as first-class graph nodes (spec §2.2, §3.1, §6.5).
 * Deliberately generalizes "documentation": repo markdown, wikis, Notion,
 * Confluence, Obsidian, and Google Docs are all just sources that emit
 * `Document`s.
 *
 * v1 ships one trivial implementation — *repo-markdown*, which discovers
 * `README*`, `docs/**`, and `adr|adrs|rfcs/**` through the git provider — so
 * `doc://` URIs and the Context panel have real content from day one. §2.2's
 * `DocumentRef`/`Document` both normalize to the domain `Document` (ADR-0002).
 * No optional methods, so no capabilities of its own.
 */
export interface KnowledgeProvider extends ProviderAdapter {
  kind: "knowledge";

  listDocuments(scope: Scope): Promise<Document[]>;
  /** `doc` is a `doc://` URI; returns the normalized document with markdown body. */
  getDocument(doc: Uri): Promise<Document>;
}
