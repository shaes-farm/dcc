import { getGitProvider } from "@/lib/providers/registry";

import {
  badRequest,
  providerError,
  releasesQuery,
  searchParams,
} from "../schema";

export const dynamic = "force-dynamic";

/**
 * `GET /api/git/releases?repo=<uri>` → one repo's releases (§6.1 panel 2).
 *
 * `Release` carries no `uri` — §3.2 defines no scheme for it — so each entry is
 * addressed by its `repo` plus its `tag`.
 */
export async function GET(request: Request): Promise<Response> {
  const query = releasesQuery.safeParse(searchParams(request));
  if (!query.success) return badRequest(query.error);

  try {
    const provider = await getGitProvider(query.data.provider);
    return Response.json(await provider.listReleases(query.data.repo));
  } catch (error) {
    return providerError(error);
  }
}
