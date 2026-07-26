"use client";

import { useSyncExternalStore } from "react";

/** How often the stamp re-renders. Fine-grained enough for "8s ago" to move. */
const TICK_MS = 5_000;

/**
 * One clock for every panel, subscribed to rather than polled per component.
 *
 * `useSyncExternalStore` is the right shape twice over: a ticking clock *is* an
 * external system, and its server snapshot lets the stamp render as nothing on
 * the server — which it must, since the server has no idea how old the data is
 * and rendering an age it would then correct is both a hydration mismatch and
 * a lie.
 */
const listeners = new Set<() => void>();
let tick = 0;
let timer: ReturnType<typeof setInterval> | undefined;

function subscribe(listener: () => void): () => void {
  // Refreshed on subscribe, not only on the interval: the timer stops when the
  // last panel unmounts, so a panel mounting later would otherwise read a
  // frozen `tick`.
  tick = Date.now();
  listeners.add(listener);

  timer ??= setInterval(() => {
    tick = Date.now();
    for (const notify of listeners) notify();
  }, TICK_MS);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== undefined) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

const getSnapshot = () => tick;

/** `0` means "no clock yet" — the server, and the first render before hydration. */
const getServerSnapshot = () => 0;

/**
 * "as of Xs ago" for a panel header (§2.1: "critical for trust at 2am").
 *
 * `live` is reserved for streams (§5.3's logs panel); a polled panel always
 * shows a real age, because "live" on 60s-old data is exactly the trust
 * problem the stamp exists to solve.
 */
export function useDataAge(updatedAt: number | undefined): string | undefined {
  const now = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (now === 0 || !updatedAt) return undefined;
  return formatDataAge(now - updatedAt);
}

/** Exported for tests; the units stay coarse so the stamp never draws the eye. */
export function formatDataAge(elapsedMs: number): string {
  const seconds = Math.max(0, Math.round(elapsedMs / 1000));
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return `${Math.round(hours / 24)}d ago`;
}
