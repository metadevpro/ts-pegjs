#!/usr/bin/env node

const fs = require("fs");
const pegjs = require("pegjs");
const tspegjs = require("./tspegjs.js");
const version = require("../package.json").version;

let args = process.argv;
args.shift();
args.shift();

const needHelp = args.find(a => a === "-h");

if (args.length === 0 || needHelp) {
    return showHelp();
}

const inFile = args[args.length - 1];
let outFile = inFile.replace(".pegjs", ".ts");
args.map((arg, index) => {
    if (arg === "-o") {
        outFile = args[index + 1];
    }
});
const trace = args.find(a => a === "--trace") ? true : false;
const cache = args.find(a => a === "--cache") ? true : false;


function showHelp() {
    /* eslint-disable no-console */
    console.log("tspegjs v." + version + "      TS target for pegjs");
    console.log("Usage:");
    console.log("  tspegjs [-o outFile.ts] [--trace] [--cache] <inGrammar.pegjs>");
}

function generateParser(input_file, output_file, trace, cache) {
  fs.readFile(input_file, function (err, data) {
    if (err) throw err;

    var parser = pegjs.generate(data.toString(), {
      output: "source",
      trace: trace,
      cache: cache,
      plugins: [tspegjs],
      tspegjs: {}
    });
    fs.writeFileSync(output_file, parser);
  });
}

generateParser(inFile, outFile, trace, cache);
