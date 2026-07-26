"use client";

import { ErrorCard } from "@/components/ds/error-card";
import { GIT_DEPENDENT_PANELS } from "@/lib/queries/git";

/**
 * The degraded state every git panel shows (§5.3: "panels degrade
 * independently — an unreachable provider turns *its* panels into inline error
 * cards; the layout stands").
 *
 * `detail` is the sentence the provider authored, carried unchanged from
 * `lib/providers` through the route handler — "401 from GitHub — check
 * GITHUB_TOKEN in your shell", never "request failed". The second line is
 * CLAUDE.md's other half of the bar: which panels stay stale until it is fixed.
 */
export function GitPanelError({ error }: { error: Error }) {
  return (
    <ErrorCard
      detail={
        <>
          <span className="block">{error.message}</span>
          <span className="text-faint mt-1.5 block text-xs">
            {GIT_DEPENDENT_PANELS}
          </span>
        </>
      }
    />
  );
}
