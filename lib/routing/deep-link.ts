import { UriParseError, toUri, type Uri } from "@/lib/domain";

/**
 * Deep links (spec §3.2) — the browser URL that mirrors a resource URI.
 *
 * §3.2 writes the form down literally: `/r/service%3A%2F%2Fcheckout`. One
 * segment, percent-encoded, so a URI copied out of the UI and pasted into the
 * address bar restores the same view. The URL is a *mirror* — `resolve.ts`
 * decides what a URI opens, and this module only writes that decision somewhere
 * the browser can hold it.
 *
 * Escaping here is ordinary `encodeURIComponent`, unlike the codec in
 * lib/domain/uri.ts, which escapes minimally to reproduce §3.2's own bytes.
 * The two are not in tension: this one escapes a whole URI *as* a URL segment,
 * where `@` and `:` no longer have to survive, and the only requirement is that
 * it comes back unchanged.
 */

/** The route that renders a resolved URI (`app/r/[uri]`). */
export const DEEP_LINK_ROOT = "/r";

/** The browser path for a URI. `service://checkout` → `/r/service%3A%2F%2Fcheckout`. */
export function deepLinkPath(uri: Uri): string {
  return `${DEEP_LINK_ROOT}/${encodeURIComponent(uri)}`;
}

/** The result of reading a deep link, which arrives from outside and can fail. */
export type DeepLinkResult =
  { ok: true; uri: Uri } | { ok: false; error: UriParseError };

/**
 * Reads the `[uri]` route segment back into a URI.
 *
 * Next hands the segment over **still encoded** — verified against Next 16, and
 * the reason this takes a raw segment rather than a decoded one. It is also why
 * `%2F` inside the segment survives instead of splitting the route, which is
 * what makes §3.2's single-segment form work at all.
 *
 * Returns a result rather than throwing: everything reaching this function came
 * from an address bar or a paste buffer, and a bad one is a view to render, not
 * an exception to catch.
 */
export function parseDeepLink(segment: string): DeepLinkResult {
  let decoded: string;
  try {
    decoded = decodeURIComponent(segment);
  } catch {
    return {
      ok: false,
      error: new UriParseError(segment, "malformed percent-escape in the URL"),
    };
  }

  try {
    // `toUri`, not `parseUri`: the URI comes back canonical, so a link written
    // by hand with an uppercase scheme lands on the same path as one copied
    // from the UI.
    return { ok: true, uri: toUri(decoded) };
  } catch (error) {
    if (error instanceof UriParseError) return { ok: false, error };
    throw error;
  }
}
