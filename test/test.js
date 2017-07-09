var fs = require("fs");
var pegjs = require("pegjs");
var tspegjs = require("../src/tspegjs.js");

var examples = {
  "Arithmetics": "arithmetics.pegjs",
  "Json": "json.pegjs",
  "Css": "css.pegjs",
  "Javascript": "javascript.pegjs",
  "ST4": "st.pegjs"
};

function generateParser(input_file, output_file) {
  fs.readFile(input_file, function (err, data) {
    if (err) throw err;

    var parser = pegjs.generate(data.toString(), {
      output: "source",
      trace: true,
      cache: true,
      plugins: [tspegjs],
      tspegjs: {
        // parserNamespace: 'Parser', 
        // parserClassName: classname
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