import { getGitProvider } from "@/lib/providers/registry";

import { badRequest, providerError, reposQuery, searchParams } from "../schema";

/** Live reads, never build-time data. */
export const dynamic = "force-dynamic";

/**
 * `GET /api/git/repos` → the configured repositories, normalized (§6.1 panel 1).
 *
 * Thin by design (`app/api/README.md`): validate, delegate, return. The GitHub
 * call, the ETag cache and the normalization all live in `lib/providers`; this
 * exists so the token stays server-side and so TanStack Query has a stable URL
 * to poll.
 */
export async function GET(request: Request): Promise<Response> {
  const query = reposQuery.safeParse(searchParams(request));
  if (!query.success) return badRequest(query.error);

  try {
    const provider = await getGitProvider(query.data.provider);
    return Response.json(await provider.listRepos());
  } catch (error) {
    return providerError(error);
  }
}
