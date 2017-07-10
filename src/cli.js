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
let allowedStartRules = null;
args.map((arg, index) => {
    if (arg === "--allowed-start-rules") {
        allowedStartRules = args[index + 1];
    }
});

const trace = args.find(a => a === "--trace") ? true : false;
const cache = args.find(a => a === "--cache") ? true : false;


function showHelp() {
    /* eslint-disable no-console */
    console.log("tspegjs v." + version + "      TS target for pegjs");
    console.log("Usage:");
    console.log("  tspegjs [-o outFile.ts] [--allowed-start-rules <rule1,rule2>] [--trace] [--cache] <inGrammar.pegjs>");
}

function generateParser(input_file, output_file, trace, cache, allowedStartRules) {
  fs.readFile(input_file, function (err, data) {
    if (err) throw err;

    const opts = {
      output: "source",
      trace: trace,
      cache: cache,
      plugins: [tspegjs],
      tspegjs: {}
    };
    if (allowedStartRules) {
        opts.allowedStartRules = allowedStartRules;
    }

    let parser = pegjs.generate(data.toString(), opts);
    fs.writeFileSync(output_file, parser);
  });
}

generateParser(inFile, outFile, trace, cache, allowedStartRules);
