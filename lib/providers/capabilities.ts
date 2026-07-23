import type { Capability, ProviderAdapter } from "./provider";

/**
 * The single gate the UI calls before rendering an affordance (§2.2): no
 * capability, no button. A thin lookup over `adapter.capabilities()`, kept in
 * one place so the "declare capabilities" rule has exactly one enforcement
 * point rather than a scattered set of `.includes` calls.
 */
export function hasCapability(
  adapter: ProviderAdapter,
  capability: Capability,
): boolean {
  return adapter.capabilities().includes(capability);
}
