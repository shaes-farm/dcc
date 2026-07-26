import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // The §3 vocabulary depends on nothing (spec §3.1, lib/domain/README.md):
  // it is what every other layer imports, so an edge pointing back out of it
  // would make the dependency graph cyclic and let provider- or UI-shaped
  // concerns leak into the canonical types. Enforced rather than documented,
  // because this is the kind of rule that erodes one convenient import at a
  // time.
  {
    files: ["lib/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/lib/*", "@/app/*", "@/components/*", "../*"],
              message:
                "lib/domain must not import from the rest of the app — it is the vocabulary everything else depends on.",
            },
          ],
        },
      ],
    },
  },
  // Credentials resolve server-side and never reach the browser (§10.1, §10.2).
  // The modules that hold a resolved token — the GitHub adapter and the
  // registry that builds it — are kept out of the `lib/providers` barrel so no
  // import path to them exists from the UI. This closes the other direction: a
  // component reaching past the barrel for one is a lint error, not something
  // to catch by grepping `.next/static` after the fact.
  //
  // Route handlers (`app/api/**/route.ts`) are the intended callers, and are
  // not matched below. `lib/config/*` is deliberately absent: config carries
  // env-var *names*, never values, and `app/layout.tsx` reads it server-side to
  // render the repair screen (§4.3).
  {
    files: ["components/**/*.{ts,tsx}", "app/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/lib/providers/git/github",
                "@/lib/providers/git/github/*",
                "@/lib/providers/registry",
              ],
              message:
                "Server-only: these hold a resolved credential. Fetch from an /api/git route instead — tokens must never enter the client bundle (§10.1).",
            },
          ],
        },
      ],
    },
  },
  // Must stay last: turns off the stylistic rules Prettier owns, so the two
  // tools never disagree about the same line.
  prettier,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored design-system export: reference material, not app source. It
    // ships its own React-less JSX conventions and would otherwise fail lint.
    "docs/design/**",
  ]),
]);

export default eslintConfig;
