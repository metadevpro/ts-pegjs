import { copyFileSync } from 'node:fs';
import rollupPluginShebang from 'rollup-plugin-add-shebang';
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
    rollupPluginShebang({ include: ['**/cli.js', '**/cli.mjs'], shebang: '#!/usr/bin/env node' }),
    dts({
      exclude: ["./src/cli.ts"]
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
    rollupOptions: { external: [/^node:/, 'peggy', 'ts-morph', /^prettier/, 'synckit'] }
  },
  test: { globals: true, testTimeout: 25000 }
});
