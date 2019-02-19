
const tmp = require('tmp');
const path = require('path');
const fsx = require('fs-extra');
const { exec } = require('child_process');
const { promisify } = require('util');
const ts = require('typescript');
const rimraf = require('rimraf');

module.exports = function(grammar, consumer, pegjsOptions) {

    return new Promise((resolve, reject) => {
        // Create a temporary directory
        tmp.dir((err, tmpPath, cleanupCallback) => {
            if (err)
                reject(err);

            const grammarFilename = path.resolve(tmpPath, 'grammar.pegjs');
            const parserFilename = path.resolve(tmpPath, 'parser.ts');
            const consumerFilename = path.resolve(tmpPath, 'consumer.ts');
            const pegjs = path.resolve(__dirname, "../../node_modules/.bin/pegjs");
            const plugin = path.resolve(__dirname, "../../src/tspegjs");

            // Create a grammar file
            fsx.writeFile(grammarFilename, grammar)
                .then(() => fsx.writeFile(consumerFilename, consumer))
                .then(() => {
                    // Invoke pegjs
                    const cmd = `${pegjs} --plugin ${plugin} --format commonjs -o ${parserFilename} ${pegjsOptions || ''} ${grammarFilename}`;
                    return promisify(exec)(cmd)
                })
                .then(() => {
                    // Compile
                    const program = ts.createProgram([parserFilename, consumerFilename], {});
                    const emitResult = program.emit();
                    let allDiagnostics = ts
                        .getPreEmitDiagnostics(program)
                        .concat(emitResult.diagnostics);

                    return allDiagnostics;
                })
                .then(result => {
                    // cleanup
                    promisify(rimraf)(tmpPath);
                    // success
                    resolve(result);
                })
                .catch(err => {
                    promisify(rimraf)(tmpPath);
                    reject(err);
                })


        })
    })

}
