const chai = require('chai');
const pegjs = require('pegjs');
const tspegjs = require('../../src/tspegjs');
const ts = require('typescript');
const tss = require('typescript-simple');
const path = require('path')

chai.use(require('./helpers'));
const { expect } = chai;

function pseudoRequireTS(tsCode) {
   const jsCode = tss(tsCode, { module: "commonjs" });
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
            allowedStartRules: [ 'start', 'other' ]
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
            dependencies: {
                'ab': 'cd'
            }
        });
        expect(parserTS).to.include("import * as ab from 'cd'");

    });

    it('External types', function() {
        const grammar = "start = 'x'";
        const parserTS = pegjs.generate(grammar, {
            output: 'source',
            format: 'commonjs',
            plugins: [ tspegjs ],
            returnTypes: {
                start: 'string'
            }
        });
        expect(parserTS + "const test: string = parse('');\n").to.compileWithoutErrors();
        expect(parserTS + "const test: number = parse('');\n").not.to.compileWithoutErrors();

    })

    it('Type inconsistency detection', function() {
        const grammar = "start = 'x' <string>{}";
        const options = {
            output: 'source',
            format: 'commonjs',
            plugins: [ tspegjs ],
            returnTypes: {
                start: 'number'
            }
        };

        expect(() => pegjs.generate(grammar, options)).to.throw("Inconsistent types for rule start");
    })

});
