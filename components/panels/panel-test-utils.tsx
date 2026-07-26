import type { ReactElement } from "react";
import { render, type RenderResult } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";

/**
 * Shared setup for panel tests: a `QueryClient` and a stubbed `fetch`.
 *
 * The git panels read server state through `/api/git/*`, so a bare `render`
 * throws "No QueryClient set". Kept here rather than repeated per file so the
 * client's test settings — no retries, no polling — are stated once.
 */

/** Renders inside a fresh `QueryClient`, isolated per test. */
export function renderWithQuery(ui: ReactElement): RenderResult {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        // A retry would make an error-path test wait out a backoff; the poll
        // interval would fire timers no assertion is waiting on.
        retry: false,
        refetchInterval: false,
        gcTime: 0,
      },
    },
  });

  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

export interface StubRoute {
  /** Substring matched against the request URL. */
  match: string;
  body: unknown;
  status?: number;
}

/**
 * Installs a `fetch` that answers by URL substring, and returns the array it
 * records request URLs into — which is how a test asserts *what* a panel asked
 * for, not just what it rendered. Anything unmatched 404s with the route
 * handlers' own `{ error: { message } }` shape, so a panel reaching for an
 * endpoint the test did not stub fails visibly.
 */
export function stubFetch(routes: StubRoute[]): string[] {
  const calls: string[] = [];

  vi.stubGlobal(
    "fetch",
    vi.fn((input: string | URL) => {
      const url = String(input);
      calls.push(url);
      const route = routes.find((candidate) => url.includes(candidate.match));

      if (!route) {
        return Promise.resolve(
          jsonResponse({ error: { message: `unstubbed: ${url}` } }, 404),
        );
      }
      return Promise.resolve(jsonResponse(route.body, route.status ?? 200));
    }),
  );

  return calls;
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** A `Repository` shaped like the one `dcc.config.json` declares by default. */
export const CHECKOUT_REPO = {
  uri: "repo://github/acme/checkout-svc",
  id: "checkout-svc",
  owner: "acme",
  name: "checkout-svc",
  provider: "github",
  defaultBranch: "main",
  tags: ["service"],
  url: "https://github.com/acme/checkout-svc",
  status: "healthy",
  lastCommit: {
    sha: "a1b2c3d4",
    shortSha: "a1b2c3d",
    message: "Extract pricing client",
  },
  openPullRequestCount: 3,
  openAlertCount: 2,
};

export const CHECKOUT_PR = {
  uri: "pr://github/acme/checkout-svc/482",
  repo: "repo://github/acme/checkout-svc",
  number: 482,
  title: "Extract pricing client",
  author: { login: "alice" },
  state: "open",
  draft: false,
  sourceBranch: "extract-pricing",
  targetBranch: "main",
  checks: "healthy",
  review: "approved",
  mergeable: true,
  createdAt: "2026-07-20T09:14:00Z",
  updatedAt: "2026-07-21T14:30:00Z",
  url: "https://github.com/acme/checkout-svc/pull/482",
};

/** Repo-qualified per ADR-0006 — the shape `formatUri` actually mints. */
export const CHECKOUT_ALERT_URI =
  "alert://github/code-scanning/acme%2Fcheckout-svc%2F1234";

export const CODEQL_ALERT = {
  uri: CHECKOUT_ALERT_URI,
  source: "code-scanning",
  severity: "critical",
  title: "Database query built from user-controlled sources",
  repo: "repo://github/acme/checkout-svc",
  path: "src/db/orders.ts",
  firstSeen: "2026-07-02T08:15:00Z",
  state: "open",
  url: "https://github.com/acme/checkout-svc/security/code-scanning/1234",
};
