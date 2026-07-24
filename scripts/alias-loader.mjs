/**
 * Resolves the `@/*` → `./*` tsconfig path alias, plus the extensionless and
 * directory-index imports the TypeScript sources use, for bare `node` runs of
 * the scripts in this directory (Node 24 strips the types itself). The app and
 * the vitest suite get this from Next / Vitest config; standalone scripts have
 * neither, so `node --import ./scripts/alias-loader.mjs` supplies it.
 *
 * Bundler-style resolution that we reproduce here:
 *   - `@/x`      → `<repo>/x`
 *   - `./x`      → `./x.ts`         when the extensionless file exists
 *   - `./dir`    → `./dir/index.ts` when it names a directory
 */

import { existsSync, statSync } from "node:fs";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = pathToFileURL(`${process.cwd()}/`);

/** Append `/index.ts` for directories and `.ts` for extensionless files. */
function withTsExtension(url) {
  const path = fileURLToPath(url);
  if (existsSync(path) && statSync(path).isDirectory()) {
    return new URL("index.ts", `${url.href}/`);
  }
  if (!existsSync(path) && existsSync(`${path}.ts`)) {
    return new URL(`${url.href}.ts`);
  }
  return url;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    let base;
    if (specifier.startsWith("@/")) {
      base = new URL(specifier.slice(2), root);
    } else if (specifier.startsWith(".") && context.parentURL) {
      base = new URL(specifier, context.parentURL);
    } else {
      return nextResolve(specifier, context);
    }
    return nextResolve(withTsExtension(base).href, context);
  },
});
