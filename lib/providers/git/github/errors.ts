/**
 * A GitHub call that failed in a way the user can do something about.
 *
 * `message` is the whole sentence a panel's `ErrorCard` renders: what broke and
 * what to change to fix it — "401 from GitHub — check GITHUB_TOKEN in your
 * shell", never "request failed" (§4.3, and the design system's bar for a
 * degraded state). It is authored here, at the only layer that knows which
 * credential was in play and which endpoint was called, and carried verbatim
 * through the route handler to the panel.
 *
 * `status` is the HTTP status the route handler echoes back, so a 401 upstream
 * stays a 401 downstream instead of collapsing into a generic 500.
 *
 * The credential never appears in either field. Upstream error bodies are
 * copied in selectively (`message` only) rather than spread, since GitHub echoes
 * request context on some responses.
 */
export class GitHubError extends Error {
  readonly status: number;

  constructor(
    message: string,
    options: { status: number; cause?: unknown } = { status: 502 },
  ) {
    super(message, { cause: options.cause });
    this.name = "GitHubError";
    this.status = options.status;
  }
}

/** Narrowing helper for the route handlers, which catch `unknown`. */
export function isGitHubError(error: unknown): error is GitHubError {
  return error instanceof GitHubError;
}
