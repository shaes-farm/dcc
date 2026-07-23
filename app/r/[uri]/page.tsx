import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { deepLinkPath, parseDeepLink, resolveUri } from "@/lib/routing";

import { ResolutionView } from "./resolution-view";
import { UnresolvableUri } from "./unresolvable-uri";

/**
 * The deep link (spec §3.2) — `/r/service%3A%2F%2Fcheckout`.
 *
 * Deliberately thin, and it stays that way: read the segment, resolve it, hand
 * the resolution to something that renders it. When the slot engine lands
 * (https://github.com/shaes-farm/dcc/issues/12) it replaces `ResolutionView`
 * and nothing else here moves.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ uri: string }>;
}): Promise<Metadata> {
  const link = parseDeepLink((await params).uri);

  // The URI is the object's name (§3.2), so it belongs in the tab title — a row
  // of DCC tabs should say which object each one is.
  return { title: link.ok ? link.uri : "Unresolvable link" };
}

export default async function ResourcePage({
  params,
}: {
  params: Promise<{ uri: string }>;
}) {
  const { uri: segment } = await params;

  // Next hands the segment over still encoded, which is what lets a URI's own
  // `/`, `?`, and `&` survive in one path segment. See lib/routing/deep-link.ts.
  const link = parseDeepLink(segment);
  if (!link.ok) return <UnresolvableUri error={link.error} segment={segment} />;

  // One object, one URL. A link typed by hand — an uppercase scheme, a stray
  // escape — is redirected to the canonical form rather than rendered at a
  // second address, so that history, favorites, and graph keys (all of which
  // compare URIs with `===`) never see two spellings of the same thing.
  const canonical = deepLinkPath(link.uri);
  if (canonical !== `/r/${segment}`) redirect(canonical);

  return <ResolutionView resolution={resolveUri(link.uri)} />;
}
