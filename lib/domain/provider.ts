import type { Status } from "./common";

/**
 * A configured integration instance (spec §3.1) — the GitHub connection, the
 * `k8s-qa` kube context, the Grafana at `grafana.acme.dev`.
 *
 * Note the naming: §3.1 calls this data-only object `Provider`, and §2.2 also
 * calls the *behavioral* contract `Provider`. They are different things — one
 * is what Settings renders and the graph addresses, the other is the plugin
 * interface with `capabilities()` and `testConnection()`. The behavioral one
 * is named `ProviderAdapter` in `lib/providers` and extends this
 * (https://github.com/shaes-farm/dcc/issues/5); domain keeps the plain noun.
 *
 * Carries no `uri`: §3.2 defines no scheme for providers, which are reached
 * through Settings rather than addressed. See the note in `git.ts`.
 */

/**
 * The integration categories (§2.2). Every vendor is an implementation of one
 * of these, not a feature of its own: GitLab is another `git`, Datadog another
 * `observability`.
 */
export const PROVIDER_KINDS = [
  "git",
  "deployment",
  "observability",
  "api",
  "issue",
  "knowledge",
  "artifact",
] as const;

export type ProviderKind = (typeof PROVIDER_KINDS)[number];

export interface Provider {
  /** Config-declared id, unique within the workspace: `github`, `k8s-qa`. */
  id: string;
  kind: ProviderKind;
  /** The vendor behind the instance: `github`, `kubernetes`, `vercel`, `loki`. */
  implementation: string;
  /** Human label for Settings; falls back to `id` when absent. */
  label?: string;
  /**
   * Reachability, from the last `testConnection()` or fetch. `unknown` until
   * something has actually talked to it — an unconfigured token is not health.
   */
  status: Status;
  /**
   * Name of the environment variable holding this provider's credential, never
   * the credential (§10.2). Absent when auth comes from `gh` CLI or kubeconfig.
   */
  tokenEnv?: string;
}
