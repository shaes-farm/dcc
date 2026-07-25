"use client";

import { useEffect, useState } from "react";

export type FixtureState<T> =
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: Error };

/**
 * Stands in for a provider call (`lib/providers`, issue #11): resolves or
 * rejects after a short delay, so a fixture panel exercises the same
 * async/error shape a real one will have. Only the loader changes when a
 * provider lands — the panel around it does not.
 *
 * `load` must be a stable reference (a module-level function, not an inline
 * closure) — it is the effect's only dependency, and a new function identity
 * every render would restart the "load" on every render too.
 */
export function useFixtureData<T>(load: () => Promise<T>): FixtureState<T> {
  const [state, setState] = useState<FixtureState<T>>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    load().then(
      (data) => {
        if (!cancelled) setState({ status: "success", data });
      },
      (error: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [load]);

  return state;
}

/** A fixture loader that resolves with `data` after `delayMs`. */
export function fixtureSuccess<T>(data: T, delayMs = 300): () => Promise<T> {
  return () =>
    new Promise((resolve) => setTimeout(() => resolve(data), delayMs));
}

/** A fixture loader that always rejects after `delayMs` — proves §5.3's independent-degradation rule without a real provider. */
export function fixtureFailure(
  message: string,
  delayMs = 300,
): () => Promise<never> {
  return () =>
    new Promise((_resolve, reject) =>
      setTimeout(() => reject(new Error(message)), delayMs),
    );
}
