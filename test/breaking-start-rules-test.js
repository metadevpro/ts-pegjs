// Repro sample by: carlossantillana from https://github.com/metadevpro/ts-pegjs/issues/78
// generate-parser.js
var fs = require('fs');
var peggy = require('peggy');
var tspegjs = require('../src/tspegjs');

fs.readFile('../examples/arithmetics.pegjs', function (err, data) {
  if (err) throw err;
  var parser = peggy.generate(data.toString(), {
    output: 'source',
    cache: true,
    plugins: [tspegjs],
    tspegjs: {
      customHeader: '// @ts-nocheck',
    },
  });
  fs.writeFileSync('../output/arithmetics.ts', parser);
});
