import { beforeEach, describe, expect, it } from 'vitest';
import * as fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { exec as execNode } from 'node:child_process';
import peggy from 'peggy';

// Local imports
import packageJson from '../package.json';
import tspegjs from '../src/tspegjs';

const exec = promisify(execNode);

const ROOT_DIR = fileURLToPath(new URL('../', import.meta.url));
const PLUGIN_PATH = path.join(ROOT_DIR, packageJson.exports.require);
const CLI_PATH = path.join(ROOT_DIR, packageJson.bin.tspegjs);
const OPTIONS_FILE = path.join(ROOT_DIR, 'test/genoptions2.json');
const GRAMMAR_FILE = path.join(ROOT_DIR, 'examples/st.pegjs');
const outTsName = path.join(ROOT_DIR, 'output/st2.ts');

describe('CLI Tests', () => {
  beforeEach(ensureCliIsBuilt);
  it(`Can import tspegjs as a Peggy plugin`, async () => {
    const { stdout, stderr } = await exec(
      `npx peggy --plugin "${PLUGIN_PATH}" --extra-options-file "${OPTIONS_FILE}" --allowed-start-rules groupFile,templateFile,templateFileRaw,templateAndEOF -o "${outTsName}" "${GRAMMAR_FILE}"`
    );
    if (stderr) {
      throw new Error(stderr);
    }
  });
  it.concurrent(`Generated \`ts\` file passes eslint check`, async () => {
    const { stdout, stderr } = await exec(`eslint "${outTsName}"`);
    if (stderr) {
      throw new Error(stderr);
    }
  });
  it.concurrent(`Can compile \`ts\` file to \`js\``, async () => {
    const { stdout, stderr } = await exec(
      `tsc --target es6 --module commonjs --declaration "${outTsName}"`
    );
    if (stderr) {
      throw new Error(stderr);
    }
  });
});

/**
 * Checks if CLI has been built and errors if it has not.
 */
function ensureCliIsBuilt() {
  if (!existsSync(CLI_PATH)) {
    throw new Error(
      `File "${CLI_PATH}" doesn't exist. You must run \`npm run build\` before executing this test.`
    );
  }
}
