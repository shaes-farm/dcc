import { getGitProvider } from "@/lib/providers/registry";

import {
  alertsQuery,
  badRequest,
  providerError,
  searchParams,
} from "../schema";

export const dynamic = "force-dynamic";

/**
 * `GET /api/git/alerts?scope=<uri|workspace>` → Dependabot, code-scanning and
 * secret-scanning findings merged into one severity-sorted table (§6.1 panel 4).
 *
 * The merge and the sort happen in the provider, not here — a handler that
 * reordered results would be business logic in the wrong layer.
 */
export async function GET(request: Request): Promise<Response> {
  const query = alertsQuery.safeParse(searchParams(request));
  if (!query.success) return badRequest(query.error);

  try {
    const provider = await getGitProvider(query.data.provider);
    return Response.json(await provider.listAlerts(query.data.scope));
  } catch (error) {
    return providerError(error);
  }
}
