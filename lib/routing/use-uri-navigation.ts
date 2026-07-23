"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";

import { UriParseError, safeParseUri, formatUri, type Uri } from "@/lib/domain";

import { deepLinkPath } from "./deep-link";

/**
 * Navigating by URI (spec §3.2).
 *
 * The one way anything in the app moves to another object. Callers hold URIs,
 * never paths — a component that builds `/r/…` itself has taken a dependency on
 * the URL shape, which §3.2 makes a mirror and not the model.
 */

/** The result of navigating to text that may not be a URI. */
export type UriNavigationResult =
  { ok: true; uri: Uri } | { ok: false; error: UriParseError };

export interface UriNavigation {
  /** Opens a URI. */
  navigateToUri(uri: Uri): void;
  /**
   * Opens text that claims to be a URI — a paste into the palette
   * (https://github.com/shaes-farm/dcc/issues/14), a link from a document.
   *
   * Returns the failure instead of throwing, so a caller can render it inline:
   * a pasted string that isn't a URI is an ordinary event in a palette, not an
   * exception. The URI is canonicalized on the way through, so `SERVICE://x`
   * and `service://x` land on one URL.
   */
  navigateToUriText(text: string): UriNavigationResult;
}

export function useUriNavigation(): UriNavigation {
  const router = useRouter();

  return useMemo(
    () => ({
      navigateToUri(uri) {
        router.push(deepLinkPath(uri));
      },

      navigateToUriText(text) {
        const parsed = safeParseUri(text.trim());
        if (!parsed.ok) return { ok: false, error: parsed.error };

        const uri = formatUri(parsed.value);
        router.push(deepLinkPath(uri));
        return { ok: true, uri };
      },
    }),
    [router],
  );
}
