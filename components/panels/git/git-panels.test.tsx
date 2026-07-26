// @vitest-environment jsdom

import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { parseUri, toUri } from "@/lib/domain";

import {
  CHECKOUT_ALERT_URI,
  CHECKOUT_PR,
  CHECKOUT_REPO,
  CODEQL_ALERT,
  renderWithQuery,
  stubFetch,
} from "../panel-test-utils";
import { PrsPanel } from "./prs-panel";
import { ReposPanel } from "./repos-panel";
import { SecurityPanel } from "./security-panel";

/** See `panel-mount.test.tsx` — `Addressable` reaches for the App Router. */
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

afterEach(() => {
  vi.unstubAllGlobals();
  cleanup();
});

const REPO_URI = toUri("repo://github/acme/checkout-svc");
const PR_URI = toUri("pr://github/acme/checkout-svc/482");
const ALERT_URI = toUri(CHECKOUT_ALERT_URI);

function unauthorized(match: string) {
  return {
    match,
    status: 401,
    body: {
      error: { message: "401 from GitHub — check GITHUB_TOKEN in your shell." },
    },
  };
}

describe("ReposPanel (§6.1 panel 1)", () => {
  it("renders live repository data for its own URI", async () => {
    stubFetch([{ match: "/api/git/repos", body: [CHECKOUT_REPO] }]);

    renderWithQuery(<ReposPanel uri={REPO_URI} params={parseUri(REPO_URI)} />);

    expect(await screen.findByText("service")).toBeDefined();
    expect(screen.getByText("3")).toBeDefined(); // open PRs
    expect(screen.getByText("2")).toBeDefined(); // open alerts
    expect(screen.getByText(/Extract pricing client/)).toBeDefined();
  });

  it("shows an em dash, not a zero, when the alert count is unknown", async () => {
    // Absent means the credential could not look; a 0 would be the guess §2.2
    // forbids.
    stubFetch([
      {
        match: "/api/git/repos",
        body: [{ ...CHECKOUT_REPO, openAlertCount: undefined }],
      },
    ]);

    renderWithQuery(<ReposPanel uri={REPO_URI} params={parseUri(REPO_URI)} />);

    expect(await screen.findByText("—")).toBeDefined();
  });

  it("points at the config when the repo is not configured", async () => {
    stubFetch([{ match: "/api/git/repos", body: [] }]);

    renderWithQuery(<ReposPanel uri={REPO_URI} params={parseUri(REPO_URI)} />);

    expect(await screen.findByText(/is not in dcc.config.json/)).toBeDefined();
  });

  it("degrades to an ErrorCard naming the env var and the blast radius", async () => {
    stubFetch([unauthorized("/api/git/repos")]);

    renderWithQuery(<ReposPanel uri={REPO_URI} params={parseUri(REPO_URI)} />);

    expect(
      await screen.findByText(/401 from GitHub — check GITHUB_TOKEN/),
    ).toBeDefined();
    expect(screen.getByText(/stay stale until this is fixed/)).toBeDefined();
  });

  it("renders nothing for a URI of another scheme", () => {
    const other = toUri("env://qa");
    const { container } = renderWithQuery(
      <ReposPanel uri={other} params={parseUri(other)} />,
    );

    expect(container.firstChild).toBeNull();
  });
});

describe("PrsPanel (§6.1 panel 2)", () => {
  it("derives the repo URI from the PR URI and renders the matching PR", async () => {
    const calls = stubFetch([{ match: "/api/git/prs", body: [CHECKOUT_PR] }]);

    renderWithQuery(<PrsPanel uri={PR_URI} params={parseUri(PR_URI)} />);

    expect(await screen.findByText("Extract pricing client")).toBeDefined();
    // One request, for the repo's list — not a per-PR endpoint.
    expect(calls[0]).toContain(
      `repo=${encodeURIComponent("repo://github/acme/checkout-svc")}`,
    );
    expect(screen.getByText("checks")).toBeDefined();
    expect(screen.getByText("approved")).toBeDefined();
    expect(screen.getByText("extract-pricing → main")).toBeDefined();
  });

  it("flags conflicts when the PR is not mergeable", async () => {
    stubFetch([
      { match: "/api/git/prs", body: [{ ...CHECKOUT_PR, mergeable: false }] },
    ]);

    renderWithQuery(<PrsPanel uri={PR_URI} params={parseUri(PR_URI)} />);

    expect(await screen.findByText("conflicts")).toBeDefined();
  });

  it("says so when the PR is not in the repo's list", async () => {
    stubFetch([{ match: "/api/git/prs", body: [] }]);

    renderWithQuery(<PrsPanel uri={PR_URI} params={parseUri(PR_URI)} />);

    expect(await screen.findByText(/#482 is not among/)).toBeDefined();
  });

  it("degrades to an ErrorCard", async () => {
    stubFetch([unauthorized("/api/git/prs")]);

    renderWithQuery(<PrsPanel uri={PR_URI} params={parseUri(PR_URI)} />);

    expect(
      await screen.findByText(/401 from GitHub — check GITHUB_TOKEN/),
    ).toBeDefined();
  });
});

describe("SecurityPanel (§6.1 panel 4)", () => {
  it("renders the workspace rollup, not a single alert", async () => {
    const calls = stubFetch([
      { match: "/api/git/alerts", body: [CODEQL_ALERT] },
    ]);

    renderWithQuery(
      <SecurityPanel uri={ALERT_URI} params={parseUri(ALERT_URI)} />,
    );

    expect(
      await screen.findByText(
        "Database query built from user-controlled sources",
      ),
    ).toBeDefined();
    // An alert:// URI names one finding, not a scope — the panel is the rollup.
    expect(calls[0]).toContain("scope=workspace");
    expect(screen.getByText("Security · workspace")).toBeDefined();
    expect(screen.getByText("critical")).toBeDefined();
    expect(screen.getByText("src/db/orders.ts")).toBeDefined();
  });

  it("has a designed empty state rather than a blank table", async () => {
    stubFetch([{ match: "/api/git/alerts", body: [] }]);

    renderWithQuery(
      <SecurityPanel uri={ALERT_URI} params={parseUri(ALERT_URI)} />,
    );

    expect(await screen.findByText(/No open alerts/)).toBeDefined();
  });

  it("degrades to a real ErrorCard — no longer the staged fixture failure", async () => {
    stubFetch([unauthorized("/api/git/alerts")]);

    renderWithQuery(
      <SecurityPanel uri={ALERT_URI} params={parseUri(ALERT_URI)} />,
    );

    expect(
      await screen.findByText(/401 from GitHub — check GITHUB_TOKEN/),
    ).toBeDefined();
  });
});
