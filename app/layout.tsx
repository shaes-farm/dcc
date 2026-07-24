import type { Metadata } from "next";
import "./globals.css";

import { ConfigRepairScreen } from "@/components/config/config-repair-screen";
import { safeLoadConfig } from "@/lib/config/load";

import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Developer Control Center",
  description: "A local-first cockpit for the software delivery lifecycle.",
};

// `safeLoadConfig` reads `dcc.config.json` off disk on every render below —
// not a Next "dynamic API", so without this Next would be free to render this
// layout once at `pnpm build` and serve that shell forever. That would defeat
// §4.3's "the app boots into a config-repair screen": a config broken after
// the build would never be re-checked under `pnpm start`.
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const config = safeLoadConfig();

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {config.ok ? (
          <Providers>{children}</Providers>
        ) : (
          <ConfigRepairScreen error={config.error} />
        )}
      </body>
    </html>
  );
}
