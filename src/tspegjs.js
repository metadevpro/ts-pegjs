exports.use = function (config, options) {
  config.passes.generate = [
    require("./passes/generate-bytecode-ts"),
    require("./passes/generate-ts")
  ];
  options.output = "source";
  if (!options.tspegjs) options.tspegjs = {};
  // if (options.tspegjs.parserNamespace === undefined) {
  //   options.tspegjs.parserNamespace = 'TSPegJs';
  // }
  // if (options.tspegjs.parserClassName === undefined) {
  //   options.tspegjs.parserClassName = 'Parser';
  // }
};
