import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  ALERT_SOURCES,
  API_KINDS,
  ARTIFACT_KINDS,
  CONFIRMATION_LEVELS,
  DOCUMENT_KINDS,
  ENVIRONMENT_TIERS,
  POD_PHASES,
  PROVIDER_KINDS,
  REVIEW_STATES,
  SEVERITIES,
  STATUSES,
  URI_SCHEMES,
  WORKLOAD_KINDS,
  toUri,
  type Action,
  type Api,
  type Artifact,
  type Dashboard,
  type Dependency,
  type Deployment,
  type Document,
  type Environment,
  type HealthCheck,
  type Issue,
  type LogStream,
  type Operation,
  type Pod,
  type Provider,
  type PullRequest,
  type Release,
  type Repository,
  type SecurityAlert,
  type Service,
  type Trace,
  type WorkflowRun,
  type Workload,
  type Workspace,
} from ".";

/**
 * Every fixture URI below goes through the codec, so a URI that does not match
 * the grammar §3.2 defines fails the suite here rather than at the first panel
 * that tries to resolve it.
 */
const uri = toUri;

/**
 * One fixture per canonical object in §3.1.
 *
 * These carry almost no runtime assertions on purpose — their job is to fail
 * `pnpm check-types` if a canonical shape stops being constructible from the
 * data a provider can realistically supply. Each is built with only its
 * required fields, so an optional field promoted to required breaks the build
 * here rather than in a panel three issues later.
 */
const fixtures = {
  workspace: {
    uri: uri("workspace://commerce"),
    name: "Acme Commerce",
  } satisfies Workspace,

  /**
   * Every reference field is populated, not left empty: an empty array
   * satisfies any element type, so `[]` would hide a field pointing at an
   * object that has no `uri` to reference in the first place.
   */
  service: {
    uri: uri("service://checkout"),
    id: "checkout",
    status: "degraded",
    environments: [uri("env://qa")],
    apis: [uri("api://checkout/rest")],
    dashboards: [uri("dashboard://grafana/uid-errors")],
    healthChecks: ["hc-checkout"],
    documents: [
      uri("doc://repo-md/checkout-svc/docs/adr/0017-extract-pricing.md"),
    ],
    owners: ["@payments-team"],
    dependsOn: [uri("service://catalog")],
  } satisfies Service,

  provider: {
    id: "github",
    kind: "git",
    implementation: "github",
    status: "healthy",
  } satisfies Provider,

  repository: {
    uri: uri("repo://github/acme/checkout-svc"),
    id: "checkout-svc",
    owner: "acme",
    name: "checkout-svc",
    provider: "github",
    defaultBranch: "main",
    tags: ["service"],
    url: "https://github.com/acme/checkout-svc",
    status: "healthy",
  } satisfies Repository,

  pullRequest: {
    uri: uri("pr://github/acme/checkout-svc/482"),
    repo: uri("repo://github/acme/checkout-svc"),
    number: 482,
    title: "Extract pricing client",
    state: "merged",
    draft: false,
    sourceBranch: "extract-pricing",
    targetBranch: "main",
    checks: "healthy",
    review: "approved",
    createdAt: "2026-07-20T09:14:00Z",
    updatedAt: "2026-07-21T14:30:00Z",
    url: "https://github.com/acme/checkout-svc/pull/482",
  } satisfies PullRequest,

  issue: {
    repo: uri("repo://github/acme/checkout-svc"),
    number: 91,
    title: "Pricing rounds down on multi-currency carts",
    state: "open",
    assignees: [],
    labels: ["bug"],
    createdAt: "2026-07-18T11:02:00Z",
    updatedAt: "2026-07-19T08:40:00Z",
    url: "https://github.com/acme/checkout-svc/issues/91",
  } satisfies Issue,

  release: {
    repo: uri("repo://github/acme/checkout-svc"),
    tag: "v3.7.12",
    prerelease: false,
    url: "https://github.com/acme/checkout-svc/releases/tag/v3.7.12",
  } satisfies Release,

  securityAlert: {
    uri: uri("alert://github/codeql/1234"),
    source: "code-scanning",
    severity: "critical",
    title: "Prototype pollution in template merge",
    repo: uri("repo://github/acme/ui-kit"),
    firstSeen: "2026-07-14T02:11:00Z",
    state: "open",
    url: "https://github.com/acme/ui-kit/security/code-scanning/1234",
  } satisfies SecurityAlert,

  dependency: {
    name: "@acme/ui-kit",
    ecosystem: "npm",
    repo: uri("repo://github/acme/storefront"),
    direct: true,
  } satisfies Dependency,

  workflowRun: {
    uri: uri("run://github/acme/checkout-svc/9182734"),
    repo: uri("repo://github/acme/checkout-svc"),
    id: "9182734",
    name: "CI",
    commit: { sha: "a1b2c3d4e5f6" },
    status: "healthy",
    startedAt: "2026-07-21T14:20:00Z",
    producedArtifacts: [uri("artifact://ghcr/acme/checkout@sha256:4bf9")],
    url: "https://github.com/acme/checkout-svc/actions/runs/9182734",
  } satisfies WorkflowRun,

  /** Derived from a running image alone — the v1 lineage case (§2.2). */
  artifact: {
    uri: uri("artifact://ghcr/acme/checkout@sha256:4bf9"),
    id: "ghcr.io/acme/checkout",
    kind: "oci",
    version: "3.7.12",
    tags: ["3.7.12", "latest"],
    digest: "sha256:4bf9",
  } satisfies Artifact,

  environment: {
    uri: uri("env://qa"),
    id: "qa",
    label: "QA",
    provider: "k8s-qa",
    tier: "shared",
    status: "degraded",
  } satisfies Environment,

  deployment: {
    uri: uri("deploy://qa/checkout/2026-07-21T14.32_a1b2c3d"),
    service: uri("service://checkout"),
    environment: uri("env://qa"),
    status: "healthy",
    startedAt: "2026-07-21T14:32:00Z",
  } satisfies Deployment,

  workload: {
    uri: uri("workload://qa/checkout/deployment/checkout"),
    name: "checkout",
    kind: "deployment",
    environment: uri("env://qa"),
    status: "failing",
  } satisfies Workload,

  pod: {
    uri: uri("pod://qa/checkout/checkout-6df4cbf8b"),
    name: "checkout-6df4cbf8b",
    workload: uri("workload://qa/checkout/deployment/checkout"),
    environment: uri("env://qa"),
    phase: "running",
    status: "failing",
    ready: false,
    restarts: 7,
    reason: "CrashLoopBackOff",
  } satisfies Pod,

  api: {
    uri: uri("api://checkout/rest"),
    id: "checkout-rest",
    kind: "rest",
    specUrl: "https://qa.acme.dev/checkout/openapi.json",
    status: "healthy",
    operations: [],
  } satisfies Api,

  operation: {
    uri: uri("op://checkout/rest/createOrder"),
    api: uri("api://checkout/rest"),
    id: "createOrder",
    tags: ["orders"],
    method: "POST",
    path: "/orders",
  } satisfies Operation,

  dashboard: {
    uri: uri("dashboard://grafana/uid-errors"),
    id: "errors",
    title: "Errors",
    provider: "grafana",
    services: [uri("service://checkout")],
  } satisfies Dashboard,

  healthCheck: {
    id: "hc-checkout",
    name: "Checkout",
    url: "https://qa.acme.dev/checkout/healthz",
    expectStatus: 200,
    status: "healthy",
  } satisfies HealthCheck,

  logStream: {
    uri: uri("logs://loki?service=checkout&env=qa"),
    provider: "loki",
    service: uri("service://checkout"),
    environment: uri("env://qa"),
  } satisfies LogStream,

  trace: {
    uri: uri("trace://tempo/4bf92f35"),
    traceId: "4bf92f35",
    provider: "tempo",
    startedAt: "2026-07-21T14:33:02Z",
    durationMs: 412,
    spans: [],
  } satisfies Trace,

  document: {
    uri: uri("doc://repo-md/checkout-svc/docs/adr/0017-extract-pricing.md"),
    title: "Extract pricing client",
    kind: "adr",
    body: "# Extract pricing client\n",
    services: [uri("service://checkout")],
    links: [uri("doc://repo-md/checkout-svc/runbooks/checkout-oncall.md")],
  } satisfies Document,

  action: {
    uri: uri(
      "action://restartWorkload?target=workload://qa/checkout/deployment/checkout",
    ),
    id: "restartWorkload",
    provider: "k8s-qa",
    targetUri: uri("workload://qa/checkout/deployment/checkout"),
    tier: "shared",
    requiredConfirmation: "standard",
    label: "Restart workload",
  } satisfies Action,
};

/** Every closed union in the vocabulary, for the shared invariants below. */
const UNIONS = {
  ALERT_SOURCES,
  API_KINDS,
  ARTIFACT_KINDS,
  CONFIRMATION_LEVELS,
  DOCUMENT_KINDS,
  ENVIRONMENT_TIERS,
  POD_PHASES,
  PROVIDER_KINDS,
  REVIEW_STATES,
  SEVERITIES,
  STATUSES,
  URI_SCHEMES,
  WORKLOAD_KINDS,
} satisfies Record<string, readonly string[]>;

describe("normalized status vocabulary", () => {
  // Locked to §2.2 by value, not by count: every deployment, CI, and
  // observability provider maps onto exactly these, and the UI renders nothing
  // else. Changing this set is a spec change, so it should fail loudly here.
  it("is exactly the five spec values, in spec order", () => {
    expect(STATUSES).toEqual([
      "healthy",
      "degraded",
      "failing",
      "deploying",
      "unknown",
    ]);
  });

  it("includes unknown, so providers never have to guess healthy", () => {
    expect(STATUSES).toContain("unknown");
  });
});

describe("closed unions", () => {
  it.each(Object.entries(UNIONS))(
    "%s has no duplicate members",
    (_, values) => {
      expect(new Set(values).size).toBe(values.length);
    },
  );

  it.each(Object.entries(UNIONS))("%s is non-empty", (_, values) => {
    expect(values.length).toBeGreaterThan(0);
  });

  it("covers every URI scheme in §3.2", () => {
    expect(URI_SCHEMES).toHaveLength(18);
  });

  it("orders severities worst-first, so index doubles as sort weight", () => {
    expect(SEVERITIES[0]).toBe("critical");
    expect(SEVERITIES.at(-1)).toBe("info");
  });
});

describe("canonical objects", () => {
  it("covers all 23 objects listed in §3.1", () => {
    expect(Object.keys(fixtures)).toHaveLength(23);
  });

  it("addresses every object §3.2 defines a scheme for", () => {
    // The five deliberate exceptions: §3.1 lists them as canonical objects but
    // §3.2 defines no scheme, so they are reached through a parent instead.
    const unaddressed = [
      "issue",
      "release",
      "dependency",
      "provider",
      "healthCheck",
    ];

    for (const [name, object] of Object.entries(fixtures)) {
      if (unaddressed.includes(name)) {
        expect(object).not.toHaveProperty("uri");
        continue;
      }

      expect(object).toHaveProperty("uri");
      const scheme = String((object as { uri: string }).uri).split("://")[0];
      expect(URI_SCHEMES).toContain(scheme);
    }
  });
});

describe("the barrel", () => {
  it("re-exports every module in the directory", () => {
    const dir = import.meta.dirname;
    const barrel = readFileSync(join(dir, "index.ts"), "utf8");

    // `.fixtures.ts` is excluded alongside `.test.ts`: fixtures are test
    // material that happens to live beside the code it describes, and
    // exporting them from the barrel would ship generators to the app.
    const modules = readdirSync(dir)
      .filter((file) => file.endsWith(".ts"))
      .filter(
        (file) =>
          file !== "index.ts" &&
          !file.endsWith(".test.ts") &&
          !file.endsWith(".fixtures.ts"),
      )
      .map((file) => file.replace(/\.ts$/, ""));

    expect(modules.length).toBeGreaterThan(0);

    for (const name of modules) {
      expect(barrel).toContain(`export * from "./${name}"`);
    }
  });
});
