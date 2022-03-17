var fs = require("fs");
var peggy = require("peggy");
var tspegjs = require("../src/tspegjs.js");

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
  fs.readFile(input_file, function (err, data) {
    if (err) throw err;

    var parser = peggy.generate(data.toString(), {
      output: "source",
      trace: true,
      cache: true,
      plugins: [tspegjs],
      tspegjs: {
        customHeader: "// customHeader a\n// customHeader b"
      },
    });
    fs.writeFileSync(output_file, parser);
  });
}

function testTypedGenerationArithmetics(input_file, output_file) {
  fs.readFile(input_file, function (err, data) {
    if (err) throw err;

    var parser = peggy.generate(data.toString(), {
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
    fs.writeFileSync(output_file, parser);
  });
}

function testTypedGenerationMinimal(input_file, output_file) {
  fs.readFile(input_file, function (err, data) {
    if (err) throw err;

    var parser = peggy.generate(data.toString(), {
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
    fs.writeFileSync(output_file, parser);
  });
}


if (!fs.existsSync("output")) fs.mkdirSync("output");

for (var classname in examples) {
  generateParser("./examples/" + examples[classname],
    "output/" + examples[classname].replace(/\.[^/.]+$/, ".ts")
  );
}

testTypedGenerationArithmetics("./examples/arithmetics.pegjs", "output/arithmetics-typed.ts");

testTypedGenerationMinimal("./examples/minimal.pegjs", "output/minimal-typed.ts");
