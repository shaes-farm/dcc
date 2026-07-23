import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  // The `@/*` alias from tsconfig.json. Without it, anything under test that
  // imports `@/lib/domain` — as every layer above the domain does — fails to
  // resolve here while building fine in Next.
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["**/*.test.{ts,tsx,mts,mjs}"],
    exclude: ["node_modules/**", ".next/**"],
  },
});
