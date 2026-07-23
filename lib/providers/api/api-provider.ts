import type { Api } from "@/lib/domain";
import type { ProviderAdapter } from "../provider";

/**
 * API spec ingest and the request playground (spec §2.2, §6.3). One adapter
 * covers both REST and GraphQL: `fetchSpec` normalizes OpenAPI 3, Swagger 2
 * (up-converted), and GraphQL introspection into the domain `Api` (with its
 * `Operation`s) — so §2.2's `NormalizedSpec` *is* the domain `Api` (ADR-0002),
 * with no separate provider-layer type. Neither method is optional, so the
 * adapter declares no capabilities of its own.
 */
export interface ApiProvider extends ProviderAdapter {
  kind: "api";

  /** Fetches and normalizes a spec into the addressable `Api` node. */
  fetchSpec(source: SpecSource): Promise<Api>;
  /** Proxies a playground request server-side, keeping credentials off the browser (§10.2). */
  proxyRequest(req: PlaygroundRequest): Promise<PlaygroundResponse>;
}

/** Where and how to fetch a spec. */
export interface SpecSource {
  type: "openapi" | "graphql";
  /** URL the spec is served from, e.g. `https://qa.acme.dev/checkout/openapi.json`. */
  url: string;
  /** Env-var *name* holding a bearer token, never the token itself (§10.2). */
  tokenEnv?: string;
}

/** A single request issued from the playground. */
export interface PlaygroundRequest {
  /** `op://…` URI of the operation being exercised. */
  operation: string;
  method: string;
  /** Fully-resolved request URL. */
  url: string;
  headers?: Record<string, string>;
  /** Serialized request body, when the operation takes one. */
  body?: string;
}

/** The proxied response. */
export interface PlaygroundResponse {
  status: number;
  headers: Record<string, string>;
  /** Response body as text; the UI pretty-prints by content type. */
  body: string;
  durationMs: number;
}
