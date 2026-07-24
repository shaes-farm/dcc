import { describe, expect, it } from "vitest";

import { closestMatch, levenshteinDistance } from "./reference-integrity";
import { dccConfigSchema } from "./schema";

type ConfigInput = Record<string, unknown>;

/**
 * A valid config exercising every reference field `checkReferenceIntegrity`
 * checks: `workspace.defaultEnvironment`, each provider category, and every
 * service reference (`repository`, `apis[]`, `dependsOn[]`). Also carries
 * `providers.external` and `healthChecks` — sections no reference field
 * points at — purely so the duplicate-id cases below can cover every
 * collection.
 */
function baseConfig(): ConfigInput {
  return {
    workspace: { name: "Acme", defaultEnvironment: "dev" },
    providers: {
      git: [{ id: "github", kind: "github", auth: "gh-cli" }],
      deployment: [
        { id: "k8s-dev", kind: "kubernetes", kubeContext: "acme-dev" },
      ],
      observability: [
        {
          id: "grafana",
          kind: "grafana",
          url: "https://grafana.acme.dev",
          tokenEnv: "GRAFANA_TOKEN",
        },
      ],
      external: [
        {
          id: "wiz",
          kind: "wiz",
          reportUrl: "https://app.wiz.io/reports/acme",
          tokenEnv: "WIZ_TOKEN",
        },
      ],
    },
    repositories: [
      {
        id: "checkout-svc",
        provider: "github",
        owner: "acme",
        name: "checkout-svc",
      },
    ],
    environments: [
      { id: "dev", label: "Development", provider: "k8s-dev", tier: "sandbox" },
    ],
    apis: [
      {
        id: "checkout-rest",
        type: "openapi",
        url: "https://qa.acme.dev/checkout/openapi.json",
      },
    ],
    dashboards: [{ id: "errors", provider: "grafana", uid: "uid-errors" }],
    healthChecks: [
      {
        id: "hc-checkout",
        name: "Checkout",
        url: "https://qa.acme.dev/checkout/healthz",
        expectStatus: 200,
      },
    ],
    services: [
      { id: "catalog" },
      {
        id: "checkout",
        repository: "checkout-svc",
        apis: ["checkout-rest"],
        dependsOn: ["catalog"],
      },
    ],
  };
}

function getArray(config: ConfigInput, path: string[]): unknown[] {
  let node: unknown = config;
  for (const key of path) node = (node as ConfigInput)[key];
  return node as unknown[];
}

/** Clones `base` and appends a copy of a collection's first entry, so its id repeats. */
function withDuplicate(base: ConfigInput, path: string[]): ConfigInput {
  const clone = structuredClone(base);
  const array = getArray(clone, path);
  array.push({ ...(array[0] as ConfigInput) });
  return clone;
}

describe("dccConfigSchema reference integrity (§4.1, #7)", () => {
  it("accepts a config exercising every reference field", () => {
    expect(() => dccConfigSchema.parse(baseConfig())).not.toThrow();
  });

  describe("dangling references", () => {
    const cases: Array<{
      label: string;
      mutate: (config: ConfigInput) => void;
      path: (string | number)[];
      badValue: string;
      suggestion?: string;
    }> = [
      {
        label: "workspace.defaultEnvironment",
        mutate: (config) => {
          (config.workspace as ConfigInput).defaultEnvironment = "de";
        },
        path: ["workspace", "defaultEnvironment"],
        badValue: "de",
        suggestion: "dev",
      },
      {
        label: "repositories[].provider",
        mutate: (config) => {
          (getArray(config, ["repositories"])[0] as ConfigInput).provider =
            "githu";
        },
        path: ["repositories", 0, "provider"],
        badValue: "githu",
        suggestion: "github",
      },
      {
        label: "environments[].provider",
        mutate: (config) => {
          (getArray(config, ["environments"])[0] as ConfigInput).provider =
            "k8s-de";
        },
        path: ["environments", 0, "provider"],
        badValue: "k8s-de",
        suggestion: "k8s-dev",
      },
      {
        label: "dashboards[].provider",
        mutate: (config) => {
          (getArray(config, ["dashboards"])[0] as ConfigInput).provider =
            "grafan";
        },
        path: ["dashboards", 0, "provider"],
        badValue: "grafan",
        suggestion: "grafana",
      },
      {
        label: "services[].repository",
        mutate: (config) => {
          (getArray(config, ["services"])[1] as ConfigInput).repository =
            "checkout-sv";
        },
        path: ["services", 1, "repository"],
        badValue: "checkout-sv",
        suggestion: "checkout-svc",
      },
      {
        label: "services[].apis[]",
        mutate: (config) => {
          (getArray(config, ["services"])[1] as ConfigInput).apis = [
            "checkout-res",
          ];
        },
        path: ["services", 1, "apis", 0],
        badValue: "checkout-res",
        suggestion: "checkout-rest",
      },
      {
        label: "services[].dependsOn[]",
        mutate: (config) => {
          (getArray(config, ["services"])[1] as ConfigInput).dependsOn = [
            "catalo",
          ];
        },
        path: ["services", 1, "dependsOn", 0],
        badValue: "catalo",
        suggestion: "catalog",
      },
    ];

    it.each(cases)(
      "rejects a dangling $label with a did-you-mean suggestion",
      ({ mutate, path, badValue, suggestion }) => {
        const config = baseConfig();
        mutate(config);

        const result = dccConfigSchema.safeParse(config);
        expect(result.success).toBe(false);

        const issue = result.error?.issues.find(
          (candidate) =>
            JSON.stringify(candidate.path) === JSON.stringify(path),
        );
        expect(issue).toBeDefined();
        expect(issue?.message).toContain(`\`${badValue}\``);
        expect(issue?.message).toContain(`did you mean \`${suggestion}\`?`);
      },
    );

    it("omits the did-you-mean clause when nothing declared is close enough", () => {
      const config = baseConfig();
      (getArray(config, ["services"])[1] as ConfigInput).dependsOn = [
        "zzzzzzzzzz",
      ];

      const result = dccConfigSchema.safeParse(config);
      expect(result.success).toBe(false);

      const issue = result.error?.issues.find(
        (candidate) =>
          JSON.stringify(candidate.path) ===
          JSON.stringify(["services", 1, "dependsOn", 0]),
      );
      expect(issue?.message).toContain("references unknown service");
      expect(issue?.message).not.toContain("did you mean");
    });
  });

  describe("duplicate ids", () => {
    const sections: Array<{ path: string[]; label: string }> = [
      { path: ["providers", "git"], label: "providers.git" },
      { path: ["providers", "deployment"], label: "providers.deployment" },
      {
        path: ["providers", "observability"],
        label: "providers.observability",
      },
      { path: ["providers", "external"], label: "providers.external" },
      { path: ["repositories"], label: "repositories" },
      { path: ["environments"], label: "environments" },
      { path: ["apis"], label: "apis" },
      { path: ["dashboards"], label: "dashboards" },
      { path: ["healthChecks"], label: "healthChecks" },
      { path: ["services"], label: "services" },
    ];

    it.each(sections)("flags a duplicate id in $label", ({ path, label }) => {
      const base = baseConfig();
      const duplicateIndex = getArray(base, path).length;
      const config = withDuplicate(base, path);

      const result = dccConfigSchema.safeParse(config);
      expect(result.success).toBe(false);

      const issue = result.error?.issues.find((candidate) =>
        candidate.message.includes("duplicate id"),
      );
      expect(issue?.message).toContain(`in \`${label}\``);
      expect(issue?.path).toEqual([...path, duplicateIndex, "id"]);
    });
  });
});

describe("levenshteinDistance", () => {
  it("is 0 for identical strings", () => {
    expect(levenshteinDistance("checkout", "checkout")).toBe(0);
  });

  it("counts a single deletion as distance 1", () => {
    expect(levenshteinDistance("errors", "error")).toBe(1);
  });

  it("counts the length of the other string against an empty one", () => {
    expect(levenshteinDistance("", "errors")).toBe(6);
    expect(levenshteinDistance("errors", "")).toBe(6);
  });
});

describe("closestMatch", () => {
  it("suggests the nearest candidate within the distance threshold", () => {
    expect(closestMatch("error", ["errors", "latency"])).toBe("errors");
  });

  it("returns undefined when nothing is close enough", () => {
    expect(closestMatch("zzzzzzzzzz", ["errors", "latency"])).toBeUndefined();
  });

  it("returns undefined for an empty candidate list", () => {
    expect(closestMatch("errors", [])).toBeUndefined();
  });
});
