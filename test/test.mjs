import { readFile, writeFileSync, existsSync, mkdirSync } from "fs";
import peggy from "peggy";
import tspegjs from "../dist/tspegjs.js";
const generate = peggy.generate;

var examples = {
  "Arithmetics": "arithmetics.pegjs",
  "Json": "json.pegjs",
  "Css": "css.pegjs",
  "Javascript": "javascript.pegjs",
  "ST4": "st.pegjs",
  "bulkOpening": "bulkOpening.pegjs",
  "minimal": "minimal.pegjs",
};

function generateParser(input_file, output_file) {
  readFile(input_file, function (err, data) {
    if (err) throw err;

    var parser = generate(data.toString(), {
      output: "source",
      trace: true,
      cache: true,
      plugins: [tspegjs],
      tspegjs: {
        customHeader: "// customHeader a\n// customHeader b"
      },
    });
    writeFileSync(output_file, parser);
  });
}

function testTypedGenerationArithmetics(input_file, output_file) {
  readFile(input_file, function (err, data) {
    if (err) throw err;

    var parser = generate(data.toString(), {
      output: "source",
      trace: true,
      cache: true,
      plugins: [tspegjs],
      tspegjs: {
        customHeader: "// customHeader a\n// customHeader b"
      },
      returnTypes: {
        "Integer": "number",
        "Expression": "number",
        "Term": "number",
        "Factor": "number"
      }
    });
    writeFileSync(output_file, parser);
  });
}

function testTypedGenerationMinimal(input_file, output_file) {
  readFile(input_file, function (err, data) {
    if (err) throw err;

    var parser = generate(data.toString(), {
      output: "source",
      trace: true,
      cache: true,
      plugins: [tspegjs],
      tspegjs: {
        customHeader: "// Minimal"
      },
      returnTypes: {
        "START": "string"
      }
    });
    writeFileSync(output_file, parser);
  });
}


if (!existsSync("output")) mkdirSync("output");

for (var classname in examples) {
  generateParser("./examples/" + examples[classname],
    "output/" + examples[classname].replace(/\.[^/.]+$/, ".ts")
  );
}

testTypedGenerationArithmetics("./examples/arithmetics.pegjs", "output/arithmetics-typed.ts");

testTypedGenerationMinimal("./examples/minimal.pegjs", "output/minimal-typed.ts");
