import { getGitProvider } from "@/lib/providers/registry";

import { badRequest, prsQuery, providerError, searchParams } from "../schema";

export const dynamic = "force-dynamic";

/**
 * `GET /api/git/prs?repo=<uri>&state=&author=&targetBranch=` → one repo's pull
 * requests with check status, review state and mergeability (§6.1 panel 2).
 */
export async function GET(request: Request): Promise<Response> {
  const query = prsQuery.safeParse(searchParams(request));
  if (!query.success) return badRequest(query.error);

  const { provider: providerId, repo, ...filter } = query.data;

  try {
    const provider = await getGitProvider(providerId);
    return Response.json(await provider.listPullRequests(repo, filter));
  } catch (error) {
    return providerError(error);
  }
}
