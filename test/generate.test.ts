import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { exec as execNode } from 'node:child_process';
import peggy from 'peggy';

// Local imports
import tspegjs from '../src/tspegjs';

const exec = promisify(execNode);

const EXAMPLES_DIR = fileURLToPath(new URL('../examples', import.meta.url));
const OUTPUT_DIR = fileURLToPath(new URL('../output', import.meta.url));

describe('Can generate parser for `arithmetics.pegjs` with custom return type', () => {
  const sampleGrammarName = 'arithmetics.pegjs';
  const grammarFile = path.join(EXAMPLES_DIR, sampleGrammarName);
  const ext = path.extname(sampleGrammarName);
  const outBaseName = path.join(OUTPUT_DIR, sampleGrammarName).slice(0, -ext.length) + '-typed';
  const outTsName = outBaseName + '.ts';
  const outJsName = outBaseName + '.js';
  it(`Can generate parser for \`${sampleGrammarName}\``, async () => {
    await generateParser(grammarFile, outTsName, `// Arithmetic`, {
      Integer: 'number',
      Expression: 'number',
      Term: 'number',
      Factor: 'number'
    });
  });
  it.concurrent(`Generated \`ts\` file passes eslint check`, async () => {
    const { stdout, stderr } = await exec(`eslint '${outTsName}'`);
    if (stderr) {
      throw new Error(stderr);
    }
  });

  it.concurrent(`Generated \`ts\` file contains custom header`, async () => {
    const source = await fs.readFile(outTsName, { encoding: 'utf-8' });
    expect(source.match(/\/\/ Arithmetic/)).toBeTruthy();
  });

  it(`Can compile \`ts\` file to \`js\``, async () => {
    const { stdout, stderr } = await exec(
      `tsc --target es6 --module commonjs --declaration '${outTsName}'`
    );
    if (stderr) {
      throw new Error(stderr);
    }
  });

  it(`Can parse arithmetics`, async () => {
    const arithmetics = await import(outJsName);
    // Run a test where we successfully parse
    const goodSource = {
      grammarSource: 'someFile.txt',
      text: '3 * 4'
    };
    expect(arithmetics.parse(goodSource.text, { grammarSource: goodSource.grammarSource })).toBe(
      12
    );

    // Run a test where parsing is unsuccessful
    const badSource = {
      grammarSource: 'someFile.txt',
      text: '3 ** 4'
    };
    expect(() => {
      try {
        arithmetics.parse(badSource.text, { grammarSource: badSource.grammarSource });
      } catch (e: any) {
        throw new Error(e.format([badSource]));
      }
    }).toThrow(
      `Error: Expected "(" or integer but "*" found.
 --> someFile.txt:1:4
  |
1 | 3 ** 4
  |    ^`
    );
  });
});

describe('Can generate parser for `minimal.pegjs` with custom return type', () => {
  const sampleGrammarName = 'minimal.pegjs';
  const grammarFile = path.join(EXAMPLES_DIR, sampleGrammarName);
  const ext = path.extname(sampleGrammarName);
  const outBaseName = path.join(OUTPUT_DIR, sampleGrammarName).slice(0, -ext.length) + '-typed';
  const outTsName = outBaseName + '.ts';
  const outJsName = outBaseName + '.js';
  it(`Can generate parser for \`${sampleGrammarName}\``, async () => {
    await generateParser(grammarFile, outTsName, `// Minimal`, {
      START: 'string'
    });
  });
  it.concurrent(`Generated \`ts\` file passes eslint check`, async () => {
    const { stdout, stderr } = await exec(`eslint "${outTsName}"`);
    if (stderr) {
      throw new Error(stderr);
    }
  });

  it.concurrent(`Generated \`ts\` file contains custom header`, async () => {
    const source = await fs.readFile(outTsName, { encoding: 'utf-8' });
    expect(source.match(/\/\/ Minimal/)).toBeTruthy();
  });

  it(`Can compile \`ts\` file to \`js\``, async () => {
    const { stdout, stderr } = await exec(
      `tsc --target es6 --module commonjs --declaration "${outTsName}"`
    );
    if (stderr) {
      throw new Error(stderr);
    }
  });
});

async function generateParser(
  inFile: string,
  outFile: string,
  customHeader = '// customHeader a\n// customHeader b',
  returnTypes: Record<string, string> = {}
) {
  if (!existsSync(inFile)) {
    throw new Error(`File "${inFile}" doesn't exist. Cannot proceed`);
  }

  const source = await fs.readFile(inFile, { encoding: 'utf-8' });
  const parser = peggy.generate(source, {
    output: 'source',
    //trace: true,
    cache: true,
    plugins: [tspegjs],
    // The Peggy types do not allow extending the config when a plugin is added, so we have to disable ts temporarily
    // @ts-ignore-next-line
    tspegjs: {
      customHeader
    },
    returnTypes
  });
  await fs.writeFile(outFile, parser, { encoding: 'utf-8' });
}
