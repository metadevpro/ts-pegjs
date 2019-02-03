const { expect } = require('chai');
const pegjs = require('pegjs');
const tspegjs = require('../../src/tspegjs');
const ts = require('typescript');
const tss = require('typescript-simple');

function pseudoRequireTS(tsCode) {
   const jsCode = tss(tsCode, { module: "CommonJS" });
    return eval("() => { let exports = {} \n" + jsCode.outputText + "\nreturn exports; }")();
}

describe('ts-pegjs end-to-end', function() {

    it('Generated code compiles', function() {

        const grammar = `start = d:[0-9]* <number>{ return parseInt(d.join('')); }
        other = [a-zA-Z]
        `;
        const parserTS = pegjs.generate(grammar, {
            output: "source",
            format: "commonjs",
            plugins: [ tspegjs ],
            allowedStartRules: [ "start", "other" ],
            tspegjs: {
                strictTyping: true
            }
        });
        const parser = pseudoRequireTS(parserTS);
    });

});
