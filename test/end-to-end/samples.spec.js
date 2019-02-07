const chai = require('chai');
const pegjs = require('pegjs');
const tspegjs = require('../../src/tspegjs');
const path = require('path');
const fs = require('fs');

const { expect } = chai;


function pseudoRequireTS(tsCode) {
   const jsCode = tss(tsCode, { module: "commonjsx" });
    return eval("() => { let exports = {} \n" + jsCode + "\nreturn exports; }")();
}

describe('Samples', function() {

    const samples = [ 'arithmetics', 'css', 'javascript', 'json', 'st' ];

    for (const optimize of [ 'speed', 'size' ]) {
        for (const sample of samples) {
            it(`Complete sample: ${sample} optimization for ${optimize}`, function() {

                const sampleFilename = path.resolve(__dirname, '../../examples', `${sample}.pegjs`)
                const grammar = fs.readFileSync(sampleFilename).toString();
                const parserTS = pegjs.generate(grammar, {
                    output: 'source',
                    format: 'commonjs',
                    plugins: [ tspegjs ],
                    optimize,
                    tspegjs: {
                        strictTyping: true
                    }
                });

                expect(parserTS).to.compileWithoutErrors;
            });
        }
}
});
