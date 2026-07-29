// Prettier v3's `format()` is async-only, but this library formats types from
// inside a synchronous Peggy compiler pass and cannot await. `synckit` runs the
// real (async) Prettier in a worker thread and blocks the caller until it replies,
// giving us a synchronous formatting call. This file is intentionally plain,
// unbundled JS: it is copied as-is into `dist/` and loaded directly by Node as a
// worker thread, so it must resolve `prettier`/`synckit` from the installed package's
// own node_modules at runtime.
import prettier from 'prettier';
import { runAsWorker } from 'synckit';

runAsWorker(async (code) => {
  return prettier.format(code, { parser: 'typescript' });
});
