import { StatusBar } from "@/components/ds/status-bar";
import { StatusBarClock } from "@/components/ds/status-bar-clock";
import type { DccConfig } from "@/lib/config/schema";

import { ServiceRail } from "./service-rail";

/**
 * The app frame (spec §8): left rail, content area, status bar along the
 * bottom. Right-side drawers (§5.5) hang off the content area and land with
 * the Context panel.
 *
 * The content area is `children` rather than a panel grid because the grid is
 * the slot engine's (https://github.com/shaes-farm/dcc/issues/12) — the frame
 * around it is what this issue owns, and it is what every surface after this
 * one is drawn inside.
 */
export function AppShell({
  config,
  children,
}: {
  config: DccConfig;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1">
        <ServiceRail config={config} />
        <main className="flex min-w-0 flex-1 flex-col overflow-auto">
          {children}
        </main>
      </div>

      {/*
       * `polling` and `issues` are left at their defaults on purpose. Nothing
       * polls yet and nothing counts issues
       * (https://github.com/shaes-farm/dcc/issues/11), so the bar reads
       * "polling paused · ○ health unknown" — §2.2's rule is that absent data
       * never reads as good news, and `issues={0}` would put a green "system
       * OK" on screen that nothing has checked.
       */}
      <StatusBar workspace={config.workspace.name} clock={<StatusBarClock />} />
    </div>
  );
}
