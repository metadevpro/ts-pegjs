import generateBytecode from "./passes/generate-bytecode-ts";
import generateTs from "./passes/generate-ts";
export default {
  use(config, options) {
    config.passes.generate = [generateBytecode, generateTs];
    if (!options.tspegjs) {
      options.tspegjs = {};
    }
    if (options.tspegjs.customHeader === undefined) {
      options.tspegjs.customHeader = null;
    }
  },
};
