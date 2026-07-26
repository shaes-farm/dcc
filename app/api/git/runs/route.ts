import { getGitProvider } from "@/lib/providers/registry";

import { badRequest, providerError, runsQuery, searchParams } from "../schema";

export const dynamic = "force-dynamic";

/**
 * `GET /api/git/runs?scope=<uri|workspace>&branch=&status=&limit=` → workflow
 * runs (§6.1 panel 3).
 *
 * `scope=workspace` is what makes "every failed workflow run across every
 * repository" one request rather than a tour of per-repo tabs.
 */
export async function GET(request: Request): Promise<Response> {
  const query = runsQuery.safeParse(searchParams(request));
  if (!query.success) return badRequest(query.error);

  const { provider: providerId, scope, ...filter } = query.data;

  try {
    const provider = await getGitProvider(providerId);
    return Response.json(await provider.listWorkflowRuns(scope, filter));
  } catch (error) {
    return providerError(error);
  }
}
