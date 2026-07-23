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
