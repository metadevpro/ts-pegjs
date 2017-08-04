exports.use = function (config, options) {
  config.passes.generate = [
    require("./passes/generate-bytecode-ts"),
    require("./passes/generate-ts")
  ];
  options.output = "source";
  if (!options.tspegjs) {
    options.tspegjs = {};
  }
  if (options.tspegjs.noTslint === undefined) {
    options.tspegjs.noTslint = false;
  }
};
