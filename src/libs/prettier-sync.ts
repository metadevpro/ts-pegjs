import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSyncFn } from 'synckit';

// Resolve this module's own directory whether we end up bundled as CJS (where
// `__dirname` is a real global) or ESM (where it is not, but `import.meta.url` is).
// `typeof __dirname` is safe even in ESM: `typeof` never throws on an unbound identifier.
declare const __dirname: string | undefined;
const currentDir =
  typeof __dirname !== 'undefined' ? __dirname : fileURLToPath(new URL(/* @vite-ignore */ '.', import.meta.url));

let syncFormat: ((code: string) => string) | undefined;

/**
 * Format TypeScript source with Prettier, synchronously.
 * Runs Prettier (which is async-only since v3) in a worker thread via `synckit`.
 */
export function formatTypeScriptSync(code: string): string {
  if (!syncFormat) {
    syncFormat = createSyncFn(path.join(currentDir, 'prettier-worker.mjs'));
  }
  return syncFormat(code);
}
