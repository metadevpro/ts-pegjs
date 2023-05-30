import viteTsconfigPaths from 'vite-tsconfig-paths';
import rollupPluginShebang from 'rollup-plugin-add-shebang';
import { defineConfig } from 'vitest/config';
import dts from 'vite-plugin-dts';

/**
 * The main configuration for Vite. This config includes
 * a custom plugin to pre-process `html` files when run in development mode.
 */
export default defineConfig({
  plugins: [
    viteTsconfigPaths(),
    rollupPluginShebang({ include: ['**/cli.js', '**/cli.mjs'], shebang: '#!/usr/bin/env node' }),
    dts({
      exclude: ["./src/cli.ts"]
    }),
  ],
  base: './',
  build: {
    outDir: 'dist',
    minify: false,
    lib: { entry: ['./src/cli.ts', './src/tspegjs.ts'], formats: ['es', 'cjs'] },
    rollupOptions: { external: [/^node:/, 'peggy', 'ts-morph', /^prettier/] }
  },
  test: { globals: true, testTimeout: 25000 }
});
