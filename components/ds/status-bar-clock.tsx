"use client";

import { useEffect, useState } from "react";

/**
 * The status bar's 24h clock (spec §7.2).
 *
 * A client component with a deliberately empty first render: the server has no
 * idea what time it is where the browser is, so rendering a time on the server
 * would either mismatch on hydration or freeze at build time and quietly lie.
 * It fills in on mount and ticks each minute.
 */
export function StatusBarClock() {
  const [now, setNow] = useState<string>();

  useEffect(() => {
    function tick() {
      setNow(
        new Date().toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      );
    }

    tick();
    const timer = setInterval(tick, 30_000);
    return () => clearInterval(timer);
  }, []);

  // `--:--` rather than nothing, so the bar does not reflow on hydration.
  return <span suppressHydrationWarning>{now ?? "--:--"}</span>;
}
