exports.use = function (config, options) {
  config.passes.generate = [
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
