const chai = require('chai');
const pegjs = require('pegjs');
const tspegjs = require('../../src/tspegjs');
const tss = require('typescript-simple');
const path = require('path');
const fs = require('fs');

const { expect } = chai;

chai.Assertion.addMethod('compileWithoutErrors', function() {
    let passed;

    try {
        tss(this._obj, { module: "commonjs" });
        passed = true;
    }
    catch(e) {
        passed = false;
    }

    this.assert(passed,
        "expected TS code to compile without errors, but it didn't",
        "expected TS code to fail compilation but it didn't"
    )
});


function pseudoRequireTS(tsCode) {
   const jsCode = tss(tsCode, { module: "commonjsx" });
    return eval("() => { let exports = {} \n" + jsCode + "\nreturn exports; }")();
}

describe('Samples', function() {

    it('arithmetic', function() {

        const grammar = fs.readFileSync(path.join(__dirname, '../../examples/arithmetics.pegjs')).toString();
        const parserTS = pegjs.generate(grammar, {
            output: 'source',
            format: 'commonjs',
            plugins: [ tspegjs ],
            tspegjs: {
                strictTyping: true
            }
        });

        expect(parserTS).to.compileWithoutErrors;
    });
});
