// Repro sample by: pblanco-dekalabs https://github.com/metadevpro/ts-pegjs/issues/79
// generate-parser.js
var fs = require('fs');
var peggy = require('peggy');
var tspegjs = require('../src/tspegjs');

fs.readFile('../examples/arithmetics.pegjs', function (err, data) {
  if (err) throw err;
  var parser = peggy.generate(data.toString(), {
    output: "source",
    format: "commonjs",
    cache: true,
    plugins: [tspegjs],
    tspegjs: {
      customHeader: "// import lib\nimport { Lib } from 'mylib';",
    },
  });
  fs.writeFileSync('../output/arithmetics.ts', parser);
});
