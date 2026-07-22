import type { Metadata } from "next";
import "./globals.css";

import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Developer Control Center",
  description: "A local-first cockpit for the software delivery lifecycle.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
