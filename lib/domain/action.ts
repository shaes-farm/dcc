import type { EnvironmentTier } from "./deployment";
import type { Uri } from "./uri";

/**
 * A safe, auditable operation against a target URI (spec §3.1, §7.1).
 *
 * The declaration only — execution, results, and the audit log belong to the
 * action framework behind `/api/actions/*`. What matters here is that an
 * action is addressable and states its own blast radius, so the confirmation
 * UX is identical whether it was invoked from a panel or the palette (§5.4).
 */

/**
 * How much friction an action demands before it runs. `typed-name` requires
 * typing the target's name and is mandatory for `prod-like` tiers (§7.1).
 */
export const CONFIRMATION_LEVELS = ["standard", "typed-name"] as const;

export type ConfirmationLevel = (typeof CONFIRMATION_LEVELS)[number];

export interface Action {
  uri: Uri;
  /** Stable verb id, e.g. `restartWorkload`, `rerunCi`, `triggerDeploy`. */
  id: string;
  /** `Provider` id that will execute it. */
  provider: string;
  /** What it acts on — a workload, a run, an environment. */
  targetUri: Uri;
  /** Tier of the target's environment; drives the confirmation level. */
  tier: EnvironmentTier;
  requiredConfirmation: ConfirmationLevel;
  /** Imperative label for the dialog and palette, e.g. "Restart workload". */
  label: string;
}
