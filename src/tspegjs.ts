import generateBytecode from './passes/generate-bytecode-ts';
import generateTs from './passes/generate-ts';
import type { Config, SourceBuildOptions } from 'peggy';

type TsPegjsOptions = {
  customHeader?: null | string;
};

export default {
  use(config: Config, options: SourceBuildOptions & { tspegjs?: TsPegjsOptions }) {
    config.passes.generate = [generateBytecode, generateTs];
    if (!options.tspegjs) {
      options.tspegjs = {};
    }
    if (options.tspegjs.customHeader === undefined) {
      options.tspegjs.customHeader = null;
    }
  }
};
