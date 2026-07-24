import type { ProviderAdapter } from "../provider";

/**
 * Dedicated issue trackers — Jira, Linear, GitHub Issues-as-tracker (spec
 * §2.2, §1.3). Defined now for future-proofing so the `issue` provider kind and
 * its config shape are stable; **no v1 implementation**. Planning-stage `Issue`
 * data in v1 comes through `GitProvider.listIssues?` instead.
 *
 * A marker interface on purpose: the operations (list/get/transition issues)
 * are added by the first tracker adapter, alongside the ADR that defines them.
 * It carries only the narrowed `kind` for now.
 */
export interface IssueProvider extends ProviderAdapter {
  kind: "issue";
}
