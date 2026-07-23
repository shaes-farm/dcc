/**
 * URI routing (spec §3.2, §9) — what a URI opens, and the URL that mirrors it.
 *
 * Import from `@/lib/routing`, never from a submodule, with one exception:
 * `use-uri-navigation` is a client hook and is imported from its own path, so
 * that a server component reading `resolveUri` does not pull `useRouter` and a
 * client boundary along with it.
 */

export * from "./panels";
export * from "./resolve";
export * from "./deep-link";
