import { copyFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';
import dts from 'vite-plugin-dts';

/**
 * The main configuration for Vite. This config includes
 * a custom plugin to pre-process `html` files when run in development mode.
 */
export default defineConfig({
  resolve: {
    tsconfigPaths: true
  },
  plugins: [
    dts({
      exclude: ['./src/cli.ts']
    }),
    {
      // `prettier-sync.ts` loads this file directly as a worker thread at runtime
      // (via synckit), so it must ship as a plain, unbundled sibling of the built output.
      name: 'copy-prettier-worker',
      closeBundle() {
        copyFileSync('src/libs/prettier-worker.mjs', 'dist/prettier-worker.mjs');
      }
    }
  ],
  base: './',
  build: {
    outDir: 'dist',
    minify: false,
    lib: { entry: ['./src/cli.ts', './src/tspegjs.ts'], formats: ['es', 'cjs'] },
    rollupOptions: {
      external: [/^node:/, 'peggy', 'ts-morph', /^prettier/, 'synckit'],
      onLog(level, log, handler) {
        // `prettier-sync.ts` only reads `import.meta.url` when `__dirname` is missing (ESM),
        // so emptying it in the CJS output is harmless.
        if (log.code === 'EMPTY_IMPORT_META') return;
        handler(level, log);
      }
    }
  },
  test: { globals: true, testTimeout: 25000 }
});
