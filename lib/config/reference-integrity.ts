import type { z } from "zod";

import type { DccConfig } from "./schema";

/**
 * Reference-integrity validation for `dccConfigSchema` (spec §4.1, #7).
 *
 * `schema.ts` validates the *shape* of each section in isolation; this module
 * validates the graph those sections form once all of them are in hand — that
 * a `service.repository`, `environment.provider`, or similar points at an id
 * that was actually declared. `checkReferenceIntegrity` is wired into
 * `dccConfigSchema` via `.superRefine()`, so `dccConfigSchema.parse` (or
 * `safeParse`) is the single validator for both concerns.
 *
 * Every dangling reference is rejected with the offending value and, when one
 * declared id is close enough to be the obvious typo, a did-you-mean
 * suggestion — the style is modeled on the spec's own illustration of the
 * message ("service `checkout` references unknown dashboard `errors` — did
 * you mean `errors`?"), though that literal pairing isn't itself one of the
 * checks below: `serviceConfig` has no `dashboards` field to be dangling in
 * the first place (dashboards attach to a service by inference/naming, §4.2,
 * never by a declared id list). The same pass also flags duplicate ids within
 * a collection — the id-collection machinery needed for dangling-reference
 * checks makes that nearly free, and a duplicate id would otherwise make
 * resolution silently ambiguous.
 */

/**
 * Edit distance between two strings (classic Levenshtein, insert/delete/
 * substitute all costing 1). No package in this repo's dependency tree is
 * safe to import for this — the only Levenshtein-shaped packages present are
 * transitive deps of lint/CLI tooling, not declared dependencies — so this is
 * a few lines hand-rolled rather than a new dependency for one comparison.
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const previousRow = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    let previousDiagonal = previousRow[0];
    previousRow[0] = i;

    for (let j = 1; j <= b.length; j++) {
      const previousUp = previousRow[j];
      previousRow[j] =
        a[i - 1] === b[j - 1]
          ? previousDiagonal
          : 1 + Math.min(previousDiagonal, previousUp, previousRow[j - 1]);
      previousDiagonal = previousUp;
    }
  }

  return previousRow[b.length];
}

/**
 * The declared id nearest to `value`, or `undefined` if nothing is close
 * enough to be worth suggesting. The threshold scales with `value`'s length
 * so a long id tolerates a few more edits than a short one, and floors at 2 so
 * a one-character typo on a short id still suggests.
 */
export function closestMatch(
  value: string,
  candidates: readonly string[],
): string | undefined {
  let best: string | undefined;
  let bestDistance = Infinity;

  for (const candidate of candidates) {
    const distance = levenshteinDistance(value, candidate);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }

  const threshold = Math.max(2, Math.ceil(value.length / 2));
  return best !== undefined && bestDistance <= threshold ? best : undefined;
}

/** Path segments Zod issues use — a mix of object keys and array indices. */
type IssuePath = (string | number)[];

/**
 * `value` coerced to a plain object for defensive property reads, or `{}` if
 * it isn't one. `checkReferenceIntegrity` runs even when other sections of
 * the config failed their own shape validation (see its doc comment below),
 * so a field `DccConfig` types as an object may, at runtime, hold whatever
 * the config author actually wrote. Reading a property off the result here is
 * always safe — anything not present just reads back `undefined`.
 */
function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

/** `value` coerced to an array for defensive iteration, or `[]` if it isn't one. */
function asArray(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}

/** `value.id`, if `value` is record-shaped and that id is a string. */
function asStringId(value: unknown): string | undefined {
  const id = asRecord(value).id;
  return typeof id === "string" ? id : undefined;
}

/**
 * Collects a collection's ids into a `Set`, flagging any repeat as a duplicate
 * issue along the way. Declared-once is as much a part of "a reference graph"
 * (§4.1) as no-dangling-references is: a duplicate id would make every
 * reference to it ambiguous rather than dangling, which is a quieter failure.
 *
 * `items` is `unknown`, not `ReadonlyArray<{ id: string }>` — see
 * `checkReferenceIntegrity`'s doc comment for why this can't be trusted to
 * match its declared shape. An entry missing a string `id` is skipped rather
 * than crashing; its own shape error is already reported elsewhere.
 */
function collectIds(
  items: unknown,
  path: IssuePath,
  ctx: z.RefinementCtx,
): Set<string> {
  const label = path.join(".");
  const ids = new Set<string>();

  asArray(items).forEach((item, index) => {
    const id = asStringId(item);
    if (id === undefined) return;

    if (ids.has(id)) {
      ctx.addIssue({
        code: "custom",
        path: [...path, index, "id"],
        message: `duplicate id \`${id}\` in \`${label}\` — ids must be unique within \`${label}\``,
      });
    }
    ids.add(id);
  });

  return ids;
}

/**
 * Flags `value` if it does not resolve within `pool`, naming the referencing
 * entity, the kind of thing it was looking for, and — when close enough — the
 * declared id it probably meant. `value` is `unknown` rather than `string |
 * undefined` for the same reason `collectIds`'s `items` is: a non-string
 * value (from a field that failed its own shape check) is treated the same as
 * an absent one — skipped, not crashed on.
 */
function checkReference(args: {
  entityKind: string;
  entityId?: string;
  targetKind: string;
  value: unknown;
  pool: Set<string>;
  path: IssuePath;
  ctx: z.RefinementCtx;
}): void {
  const { entityKind, entityId, targetKind, value, pool, path, ctx } = args;
  if (typeof value !== "string") return;
  if (pool.has(value)) return;

  const subject =
    entityId === undefined ? entityKind : `${entityKind} \`${entityId}\``;
  const suggestion = closestMatch(value, [...pool]);
  const message =
    `${subject} references unknown ${targetKind} \`${value}\`` +
    (suggestion ? ` — did you mean \`${suggestion}\`?` : "");

  ctx.addIssue({ code: "custom", path, message });
}

type ProviderCategory = "git" | "deployment" | "observability";

/**
 * Maps each provider-referencing section to the provider category its
 * `provider` field must resolve within, and the entity noun used in error
 * messages. A table rather than one hand-written block per section, so
 * adding a fourth provider-backed section is a row here rather than a fourth
 * copy-pasted loop with its own chance to check the wrong category's pool.
 */
const PROVIDER_REFERENCE_SECTIONS: ReadonlyArray<{
  section: "repositories" | "environments" | "dashboards";
  entityKind: string;
  category: ProviderCategory;
}> = [
  { section: "repositories", entityKind: "repository", category: "git" },
  {
    section: "environments",
    entityKind: "environment",
    category: "deployment",
  },
  {
    section: "dashboards",
    entityKind: "dashboard",
    category: "observability",
  },
];

/**
 * The root reference-integrity pass — attached to `dccConfigSchema` via
 * `.superRefine(checkReferenceIntegrity, { when: () => true })`.
 *
 * The `when` override is load-bearing: Zod skips a `.superRefine()` by
 * default once *any* other issue exists anywhere in the config, which would
 * otherwise hide every dangling/duplicate-id problem behind one unrelated
 * typo (a config with a bad `environments[].tier` *and* a dangling
 * `services[].repository` would report only the tier error, and a user would
 * only discover the dangling reference after fixing the first and
 * resubmitting). Forcing this to always run means `config` cannot be trusted
 * to actually match `DccConfig` at runtime — a section that failed its own
 * shape check may hold whatever the author wrote — so every access below goes
 * through `asRecord`/`asArray`/`asStringId` rather than assuming the
 * type-level shape holds.
 *
 * Provider references are checked against the matching category
 * (`repositories[].provider` against `providers.git`, `environments[].provider`
 * against `providers.deployment`, `dashboards[].provider` against
 * `providers.observability`), not a flattened pool of every provider id —
 * `repositories[].provider` naming a Grafana instance is exactly the kind of
 * mistake this pass exists to catch, not one to let through because some
 * provider by that id exists somewhere in the file.
 *
 * New reference-shaped fields added to `schema.ts` (an `idRef`-typed field, or
 * a record keyed by one, like `services[].baseUrls` below) need a matching
 * check added here by hand — nothing structurally enforces the link between
 * "field declared as a reference" and "check exists for it."
 */
export function checkReferenceIntegrity(
  config: DccConfig,
  ctx: z.RefinementCtx,
): void {
  const providers = asRecord(config.providers);
  const providerPools: Record<ProviderCategory, Set<string>> = {
    git: collectIds(providers.git, ["providers", "git"], ctx),
    deployment: collectIds(
      providers.deployment,
      ["providers", "deployment"],
      ctx,
    ),
    observability: collectIds(
      providers.observability,
      ["providers", "observability"],
      ctx,
    ),
  };
  // No reference field points at `providers.external` yet; collected for the
  // duplicate-id check only.
  collectIds(providers.external, ["providers", "external"], ctx);

  const repositoryIds = collectIds(config.repositories, ["repositories"], ctx);
  const environmentIds = collectIds(config.environments, ["environments"], ctx);
  const apiIds = collectIds(config.apis, ["apis"], ctx);
  // No reference field points at `dashboards` or `healthChecks` yet;
  // collected for the duplicate-id check only.
  collectIds(config.dashboards, ["dashboards"], ctx);
  collectIds(config.healthChecks, ["healthChecks"], ctx);
  const serviceIds = collectIds(config.services, ["services"], ctx);

  checkReference({
    entityKind: "workspace",
    targetKind: "environment",
    value: asRecord(config.workspace).defaultEnvironment,
    pool: environmentIds,
    path: ["workspace", "defaultEnvironment"],
    ctx,
  });

  for (const { section, entityKind, category } of PROVIDER_REFERENCE_SECTIONS) {
    asArray(config[section]).forEach((entry, index) => {
      checkReference({
        entityKind,
        entityId: asStringId(entry),
        targetKind: "provider",
        value: asRecord(entry).provider,
        pool: providerPools[category],
        path: [section, index, "provider"],
        ctx,
      });
    });
  }

  asArray(config.services).forEach((entry, index) => {
    const service = asRecord(entry);
    const entityId = asStringId(entry);

    checkReference({
      entityKind: "service",
      entityId,
      targetKind: "repository",
      value: service.repository,
      pool: repositoryIds,
      path: ["services", index, "repository"],
      ctx,
    });

    asArray(service.apis).forEach((apiId, apiIndex) => {
      checkReference({
        entityKind: "service",
        entityId,
        targetKind: "api",
        value: apiId,
        pool: apiIds,
        path: ["services", index, "apis", apiIndex],
        ctx,
      });
    });

    asArray(service.dependsOn).forEach((dependencyId, dependencyIndex) => {
      checkReference({
        entityKind: "service",
        entityId,
        targetKind: "service",
        value: dependencyId,
        pool: serviceIds,
        path: ["services", index, "dependsOn", dependencyIndex],
        ctx,
      });
    });

    // Keys, not values: `baseUrls` is a record keyed by environment id
    // (schema.ts), so what can dangle is the key, not the URL string it maps to.
    Object.keys(asRecord(service.baseUrls)).forEach((environmentId) => {
      checkReference({
        entityKind: "service",
        entityId,
        targetKind: "environment",
        value: environmentId,
        pool: environmentIds,
        path: ["services", index, "baseUrls", environmentId],
        ctx,
      });
    });
  });
}
