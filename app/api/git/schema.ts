import { z } from "zod";

import { STATUSES, safeParseUri, type Uri } from "@/lib/domain";
import { isGitHubError } from "@/lib/providers/git/github/errors";

/**
 * Input validation and error serialization for `/api/git/*`.
 *
 * Zod belongs at boundaries, not in the domain — this is one of the two
 * boundaries that gets a schema (the other is `dcc.config.json`). Handlers stay
 * thin by importing from here: parse, delegate, return.
 */

/**
 * A query parameter carrying a URI. Runs the string through the codec, so the
 * error a caller gets is the codec's own ("expected 3 path segments, found 2"),
 * not a second, vaguer opinion about URI grammar maintained here.
 */
const uriParam = z.string().transform((value, ctx) => {
  const parsed = safeParseUri(value);
  if (!parsed.ok) {
    ctx.addIssue({ code: "custom", message: parsed.error.message });
    return z.NEVER;
  }
  // Round-trips through the codec, so the handler downstream holds a canonical,
  // branded `Uri` rather than whatever spelling arrived on the wire.
  return value as Uri;
});

/** `Uri | "workspace"` (§2.2's `Scope`) as it arrives in a query string. */
const scopeParam = z.union([z.literal("workspace"), uriParam]);

export const reposQuery = z.object({
  provider: z.string().min(1).optional(),
});

export const prsQuery = z.object({
  provider: z.string().min(1).optional(),
  repo: uriParam,
  state: z.enum(["open", "merged", "closed"]).optional(),
  author: z.string().min(1).optional(),
  targetBranch: z.string().min(1).optional(),
});

export const runsQuery = z.object({
  provider: z.string().min(1).optional(),
  scope: scopeParam,
  branch: z.string().min(1).optional(),
  // Reuses the domain's exported `const` array rather than restating the
  // vocabulary — the closed-union convention exists so boundaries can do this.
  status: z.enum(STATUSES).optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const alertsQuery = z.object({
  provider: z.string().min(1).optional(),
  scope: scopeParam,
});

export const releasesQuery = z.object({
  provider: z.string().min(1).optional(),
  repo: uriParam,
});

/** `URLSearchParams` as a plain object, dropping absent keys so `.optional()` works. */
export function searchParams(request: Request): Record<string, string> {
  return Object.fromEntries(new URL(request.url).searchParams);
}

/**
 * The one error shape every git route returns. `message` is the actionable
 * sentence the provider authored — it reaches the panel's `ErrorCard` verbatim,
 * which is the whole reason the adapter writes messages rather than codes.
 */
export interface ApiErrorBody {
  error: { message: string };
}

export function badRequest(error: z.ZodError): Response {
  const message = error.issues
    .map((issue) =>
      issue.path.length > 0
        ? `${issue.path.join(".")}: ${issue.message}`
        : issue.message,
    )
    .join("; ");

  return errorResponse(message, 400);
}

/**
 * Maps a thrown provider error onto a response. A `GitHubError` already carries
 * both halves; anything else is a bug in DCC rather than upstream, so it
 * becomes a 500 with a generic message — an unexpected stack is not something
 * to render in a panel.
 */
export function providerError(error: unknown): Response {
  if (isGitHubError(error)) {
    return errorResponse(error.message, error.status);
  }
  if (error instanceof Error && error.name === "ConfigLoadError") {
    return errorResponse(error.message, 500);
  }
  return errorResponse(
    "DCC failed to reach the git provider. Check the server log for details.",
    500,
  );
}

function errorResponse(message: string, status: number): Response {
  const body: ApiErrorBody = { error: { message } };
  return Response.json(body, { status });
}
