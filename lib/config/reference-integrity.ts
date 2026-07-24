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
 * suggestion (the issue's own example: "service `checkout` references unknown
 * dashboard `errors` — did you mean `errors`?"). The same pass also flags
 * duplicate ids within a collection — the id-collection machinery needed for
 * dangling-reference checks makes that nearly free, and a duplicate id would
 * otherwise make resolution silently ambiguous.
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
 * Collects a collection's ids into a `Set`, flagging any repeat as a duplicate
 * issue along the way. Declared-once is as much a part of "a reference graph"
 * (§4.1) as no-dangling-references is: a duplicate id would make every
 * reference to it ambiguous rather than dangling, which is a quieter failure.
 */
function collectIds(
  items: ReadonlyArray<{ id: string }> | undefined,
  path: IssuePath,
  label: string,
  ctx: z.RefinementCtx,
): Set<string> {
  const ids = new Set<string>();
  items?.forEach((item, index) => {
    if (ids.has(item.id)) {
      ctx.addIssue({
        code: "custom",
        path: [...path, index, "id"],
        message: `duplicate id \`${item.id}\` in \`${label}\` — ids must be unique within \`${label}\``,
      });
      return;
    }
    ids.add(item.id);
  });
  return ids;
}

/**
 * Flags `value` if it does not resolve within `pool`, naming the referencing
 * entity, the kind of thing it was looking for, and — when close enough — the
 * declared id it probably meant.
 */
function checkReference(args: {
  entityKind: string;
  entityId?: string;
  targetKind: string;
  value: string | undefined;
  pool: Set<string>;
  path: IssuePath;
  ctx: z.RefinementCtx;
}): void {
  const { entityKind, entityId, targetKind, value, pool, path, ctx } = args;
  if (value === undefined || pool.has(value)) return;

  const subject =
    entityId === undefined ? entityKind : `${entityKind} \`${entityId}\``;
  const suggestion = closestMatch(value, [...pool]);
  const message =
    `${subject} references unknown ${targetKind} \`${value}\`` +
    (suggestion ? ` — did you mean \`${suggestion}\`?` : "");

  ctx.addIssue({ code: "custom", path, message });
}

/**
 * The root reference-integrity pass — attached to `dccConfigSchema` via
 * `.superRefine(checkReferenceIntegrity)`.
 *
 * Provider references are checked against the matching category
 * (`repositories[].provider` against `providers.git`, `environments[].provider`
 * against `providers.deployment`, `dashboards[].provider` against
 * `providers.observability`), not a flattened pool of every provider id —
 * `repositories[].provider` naming a Grafana instance is exactly the kind of
 * mistake this pass exists to catch, not one to let through because some
 * provider by that id exists somewhere in the file.
 */
export function checkReferenceIntegrity(
  config: DccConfig,
  ctx: z.RefinementCtx,
): void {
  const gitProviderIds = collectIds(
    config.providers?.git,
    ["providers", "git"],
    "providers.git",
    ctx,
  );
  const deploymentProviderIds = collectIds(
    config.providers?.deployment,
    ["providers", "deployment"],
    "providers.deployment",
    ctx,
  );
  const observabilityProviderIds = collectIds(
    config.providers?.observability,
    ["providers", "observability"],
    "providers.observability",
    ctx,
  );
  // No reference field points at `providers.external` yet; collected for the
  // duplicate-id check only.
  collectIds(
    config.providers?.external,
    ["providers", "external"],
    "providers.external",
    ctx,
  );

  const repositoryIds = collectIds(
    config.repositories,
    ["repositories"],
    "repositories",
    ctx,
  );
  const environmentIds = collectIds(
    config.environments,
    ["environments"],
    "environments",
    ctx,
  );
  const apiIds = collectIds(config.apis, ["apis"], "apis", ctx);
  // No reference field points at `dashboards` or `healthChecks` yet;
  // collected for the duplicate-id check only.
  collectIds(config.dashboards, ["dashboards"], "dashboards", ctx);
  collectIds(config.healthChecks, ["healthChecks"], "healthChecks", ctx);
  const serviceIds = collectIds(config.services, ["services"], "services", ctx);

  checkReference({
    entityKind: "workspace",
    targetKind: "environment",
    value: config.workspace.defaultEnvironment,
    pool: environmentIds,
    path: ["workspace", "defaultEnvironment"],
    ctx,
  });

  config.repositories?.forEach((repository, index) => {
    checkReference({
      entityKind: "repository",
      entityId: repository.id,
      targetKind: "provider",
      value: repository.provider,
      pool: gitProviderIds,
      path: ["repositories", index, "provider"],
      ctx,
    });
  });

  config.environments?.forEach((environment, index) => {
    checkReference({
      entityKind: "environment",
      entityId: environment.id,
      targetKind: "provider",
      value: environment.provider,
      pool: deploymentProviderIds,
      path: ["environments", index, "provider"],
      ctx,
    });
  });

  config.dashboards?.forEach((dashboard, index) => {
    checkReference({
      entityKind: "dashboard",
      entityId: dashboard.id,
      targetKind: "provider",
      value: dashboard.provider,
      pool: observabilityProviderIds,
      path: ["dashboards", index, "provider"],
      ctx,
    });
  });

  config.services?.forEach((service, index) => {
    checkReference({
      entityKind: "service",
      entityId: service.id,
      targetKind: "repository",
      value: service.repository,
      pool: repositoryIds,
      path: ["services", index, "repository"],
      ctx,
    });

    service.apis?.forEach((apiId, apiIndex) => {
      checkReference({
        entityKind: "service",
        entityId: service.id,
        targetKind: "api",
        value: apiId,
        pool: apiIds,
        path: ["services", index, "apis", apiIndex],
        ctx,
      });
    });

    service.dependsOn?.forEach((dependencyId, dependencyIndex) => {
      checkReference({
        entityKind: "service",
        entityId: service.id,
        targetKind: "service",
        value: dependencyId,
        pool: serviceIds,
        path: ["services", index, "dependsOn", dependencyIndex],
        ctx,
      });
    });
  });
}
