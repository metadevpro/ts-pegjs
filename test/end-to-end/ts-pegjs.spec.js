const { expect } = require('chai');
const pegjs = require('pegjs');
const tspegjs = require('../../src/tspegjs');
const ts = require('typescript');
const tss = require('typescript-simple');
const path = require('path')

function pseudoRequireTS(tsCode) {
   const jsCode = tss(tsCode, { module: "commonjsx" });
    return eval("() => { let exports = {} \n" + jsCode + "\nreturn exports; }")();
}

describe('ts-pegjs end-to-end', function() {

    it('Generated code compiles (no trace)', function() {

        const grammar = `start = d:[0-9]* <number>{ return parseInt(d.join('')); }
        other = [a-zA-Z]+
        `;
        const parserTS = pegjs.generate(grammar, {
            output: 'source',
            format: 'commonjs',
            plugins: [ tspegjs ],
            allowedStartRules: [ 'start', 'other' ],
            tspegjs: {
                strictTyping: true
            }
        });

        const parser = pseudoRequireTS(parserTS);
        expect(parser.parse("12")).to.equal(12);
        expect(parser.parseStart("43279")).to.equal(43279);
        expect(parser.parseOther("abc")).to.deep.equal(['a', 'b', 'c']);
    });

    it('Generated code compiles (with trace)', function() {

        const grammar = `start = d:[0-9]* <number>{ return parseInt(d.join('')); }
        other = [a-zA-Z]+
        `;
        const parserTS = pegjs.generate(grammar, {
            output: 'source',
            format: 'commonjs',
            plugins: [ tspegjs ],
            allowedStartRules: [ 'start', 'other' ],
            tspegjs: {
                strictTyping: true
            },
            trace: true
        });

        const parser = pseudoRequireTS(parserTS);
        expect(parser.parse("12")).to.equal(12);
        expect(parser.parseStart("43279")).to.equal(43279);
        expect(parser.parseOther("abc")).to.deep.equal(['a', 'b', 'c']);
    });

    it('Import dependencies', function() {
        const grammar = "start = 'x'";
        const parserTS = pegjs.generate(grammar, {
            output: 'source',
            format: 'commonjs',
            plugins: [ tspegjs ],
            tspegjs: {
                strictTyping: true
            },
            dependencies: {
                'ab': 'cd'
            }
        });
        expect(parserTS).to.include("import * as ab from 'cd'");

    });

});
