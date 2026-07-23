import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { UriParseError } from "@/lib/domain";

/**
 * A link that did not resolve.
 *
 * Rendered, not `notFound()`: the URL is well-formed and the route exists — the
 * *URI* is wrong, and only this page can say how. A 404 would throw away the
 * one thing worth showing, which is the parser's own account of what it choked
 * on. Follows the design system's `ErrorCard` contract: actionable mono detail,
 * not "something went wrong".
 */
export function UnresolvableUri({
  error,
  segment,
}: {
  error: UriParseError;
  segment: string;
}) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-start gap-4 p-16">
      <h1 className="font-heading text-xl font-semibold tracking-tight">
        This link doesn&apos;t point at anything
      </h1>

      <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 font-mono text-xs break-all text-destructive">
        {error.message}
      </p>

      <p className="max-w-prose text-sm text-muted-foreground">
        The URL carried{" "}
        <code className="font-mono text-xs break-all">
          {decodeSafely(segment)}
        </code>
        , which is not a resource URI. They look like{" "}
        <code className="font-mono text-xs">service://checkout</code> or{" "}
        <code className="font-mono text-xs">
          pod://qa/checkout/checkout-6df4
        </code>
        .
      </p>

      <Button asChild variant="outline">
        <Link href="/">Back to the workspace</Link>
      </Button>
    </main>
  );
}

/** The segment as the reader typed it, or as it arrived if it will not decode. */
function decodeSafely(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}
