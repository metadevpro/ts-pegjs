exports.use = function (config, options) {

  config.parser = require("./parser/parser")

  config.passes.generate = [
    require("./passes/infer-types"),
    require("./passes/generate-bytecode-ts"),
    require("./passes/generate-ts")
  ];
  if (!options.tspegjs) {
    options.tspegjs = {};
  }
  if (options.tspegjs.noTslint === undefined) {
    options.tspegjs.noTslint = false;
  }
  if (options.tspegjs.customHeader === undefined) {
    options.tspegjs.customHeader = null;
  }
};
