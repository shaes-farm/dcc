import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { SCHEMA_PATH, serializeJsonSchema } from "@/lib/config/json-schema";
import { dccConfigSchema } from "@/lib/config/schema";

const EXAMPLE_CONFIG_PATH = fileURLToPath(
  new URL("../../dcc.config.json", import.meta.url),
);

const exampleConfig = JSON.parse(readFileSync(EXAMPLE_CONFIG_PATH, "utf8"));

describe("dccConfigSchema", () => {
  it("accepts the §4.1 example config shipped as dcc.config.json", () => {
    expect(() => dccConfigSchema.parse(exampleConfig)).not.toThrow();
  });

  it("accepts an inference-first service that is only an id (§4.2)", () => {
    const parsed = dccConfigSchema.parse({
      workspace: { name: "Minimal" },
      services: [{ id: "checkout" }],
    });
    expect(parsed.services).toEqual([{ id: "checkout" }]);
  });

  it("rejects an unknown top-level key", () => {
    const result = dccConfigSchema.safeParse({
      workspace: { name: "Acme" },
      nope: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a service with no id", () => {
    const result = dccConfigSchema.safeParse({
      workspace: { name: "Acme" },
      services: [{ name: "Checkout" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an environment tier outside the vocabulary", () => {
    const result = dccConfigSchema.safeParse({
      workspace: { name: "Acme" },
      environments: [
        { id: "prod", label: "Prod", provider: "k8s", tier: "production" },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("has no field that accepts a credential value — only tokenEnv (§10.2)", async () => {
    // Structural guarantee: the generated schema must never name a property
    // that would hold a raw secret. Credentials are referenced by env-var name.
    const schemaText = await serializeJsonSchema();
    for (const forbidden of ['"token"', '"secret"', '"password"', '"apiKey"']) {
      expect(schemaText).not.toContain(`${forbidden}:`);
    }
    expect(schemaText).toContain('"tokenEnv"');
  });
});

describe("schema/dcc.schema.json", () => {
  it("is in sync with dccConfigSchema — run `pnpm gen:schema` if this fails", async () => {
    const checkedIn = readFileSync(SCHEMA_PATH, "utf8");
    expect(checkedIn).toBe(await serializeJsonSchema());
  });
});
