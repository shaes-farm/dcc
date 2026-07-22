"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * Server-state boundary (spec §2.1).
 *
 * Per-domain polling intervals — env status 15s, PRs/checks 60s, security 5m —
 * belong on the individual queries, not here. These defaults only encode what
 * is true of every query in the app.
 */
function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Panels show an explicit "as of Xs ago" stamp, so a window focus is
        // not a reason to refetch and make the whole grid flicker.
        refetchOnWindowFocus: false,
        staleTime: 30_000,
        retry: 1,
      },
    },
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  // Created in state, not at module scope: a module-level client would be
  // shared across requests on the server and leak one user's cache into
  // the next render.
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
