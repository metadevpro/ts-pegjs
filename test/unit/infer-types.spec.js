"use strict";

const chai = require( "chai" );
const helpers = require( "./helpers" );
const pass = require( "../../src/passes/infer-types");

chai.use( helpers );

const expect = chai.expect;

describe( "compiler pass |inferTypes|", function () {

    it('Rule with type specification', function() {
        expect(pass).to.changeAST(
            "start = 'x' <boolean>{}",
            {
                rules: [
                    {
                        name: "start",
                        expression: { type: "action" },
                        inferredType: 'boolean'
                    }
                ]
            }
        );
    });

    it('Literal rule', function() {
        expect(pass).to.changeAST(
            "start = 'x'",
            {
                rules: [
                    {
                        name: "start",
                        expression: { type: "literal" },
                        inferredType: 'string'
                    }
                ]
            }
        );
    });

    it('Labeled rule', function() {
        expect(pass).to.changeAST(
            "start = abc:'x'",
            {
                rules: [
                    {
                        name: "start",
                        expression: { type: "labeled" },
                        inferredType: 'string'
                    }
                ]
            }
        );
    });

    it('Rule reference (in-order)', function() {
        expect(pass).to.changeAST(
            "rule1 = 'x' <SomeType>{}\n" +
            "rule2 = rule1\n",
            {
                rules: [
                    {
                        name: "rule1",
                        inferredType: 'SomeType'
                    },
                    {
                        name: "rule2",
                        inferredType: 'SomeType'
                    }
                ]
            }
        );
    });

    it('Rule reference (out-of-order)', function() {
        expect(pass).to.changeAST(
            "rule2 = rule1\n" +
            "rule1 = 'x' <SomeType>{}\n",
            {
                rules: [
                    {
                        name: "rule2",
                        inferredType: 'SomeType'
                    },
                    {
                        name: "rule1",
                        inferredType: 'SomeType'
                    }
                ]
            }
        );
    });

    it('Rule reference (out-of-order, multiple)', function() {
        expect(pass).to.changeAST(
            "rule4 = rule2\n" +
            "rule3 = 'x'\n" +
            "rule2 = rule1\n" +
            "rule1 = 'x' <SomeType>{}\n",
            {
                rules: [
                    {
                        name: "rule4",
                        inferredType: 'SomeType'
                    },
                    {
                        name: "rule3",
                        inferredType: 'string'
                    },
                    {
                        name: "rule2",
                        inferredType: 'SomeType'
                    },
                    {
                        name: "rule1",
                        inferredType: 'SomeType'
                    }
                ]
            }
        );
    });

    it('Rule reference (out-of-order, composite)', function() {
        expect(pass).to.changeAST(
            "rule1 = 'x'\n" +
            "composite = rule1 rule2 rule3\n" +
            "rule2 = 'x' <number>{}\n" +
            "rule3 = 'x'\n",
            {
                rules: [
                    {
                        name: "rule1",
                        inferredType: 'string'
                    },
                    {
                        name: "composite",
                        inferredType: '[string,number,string]'
                    },
                    {
                        name: "rule2",
                        inferredType: 'number'
                    },
                    {
                        name: "rule3",
                        inferredType: 'string'
                    }
                ]
            }
        );
    });

    it('Rule reference (cyclic)', function() {
        expect(pass).to.reportError(
            "rule1 = rule2\n" +
            "rule2 = rule1\n",
            
            { message: "Cyclic rule reference in: rule1, rule2" }
        );
    });

    it('Sequence', function() {
        expect(pass).to.changeAST(
            "start = 'a' 'b' 'c'",
            {
                rules: [
                    {
                        type: "rule",
                        expression: { type: "sequence", elements: [
                            { type: 'literal' },
                            { type: 'literal' },
                            { type: 'literal' }
                        ] },
                        inferredType: '[string,string,string]'
                    }
                ]
            }
        );
    });

} );
