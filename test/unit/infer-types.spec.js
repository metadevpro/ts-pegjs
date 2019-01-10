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

    it('Choice - identical types', function() {
        expect(pass).to.changeAST(
            "start = 'a' / 'b' / 'c'",
            {
                rules: [
                    {
                        type: "rule",
                        inferredType: "string",
                        expression: {
                            type: "choice",
                            inferredType: "string",
                            alternatives: [
                                { type: "literal", inferredType: "string" },
                                { type: "literal", inferredType: "string" },
                                { type: "literal", inferredType: "string" }
                            ]
                        }
                    }
                ]
            }
        )
    });

    it('Choice - different types', function() {
        expect(pass).to.changeAST(
            "start = 'a' <Type1>{} / 'b' / 'c' <Type1>{}",
            {
                rules: [
                    {
                        type: "rule",
                        inferredType: "Type1|string",
                        expression: {
                            type: "choice",
                            inferredType: "Type1|string",
                            alternatives: [
                                { type: "action", inferredType: "Type1" },
                                { type: "literal", inferredType: "string" },
                                { type: "action", inferredType: "Type1" }
                            ]
                        }
                    }
                ]
            }
        )
    });

    it('Optional', function() {
        expect(pass).to.changeAST(
            "start = 'a'?",
            {
                rules: [
                    {
                        type: "rule",
                        inferredType: 'string|null',
                        expression: {
                            type: "optional",
                            expression: {
                                type: 'literal'
                            }
                        }
                    }
                ]
            }
        );
    });

    it('X or more', function() {
        expect(pass).to.changeAST(
            "start = 'a'+ 'b'*",
            {
                rules: [
                    {
                        type: "rule",
                        inferredType: "[string[],string[]]",
                        expression: {
                            type: "sequence",
                            inferredType: "[string[],string[]]",
                            elements: [
                                { type: 'one_or_more', inferredType: 'string[]' },
                                { type: 'zero_or_more', inferredType: 'string[]' }
                            ]
                        }
                    }
                ]
            }
        );
    });

    it('Prefix and/not', function() {
        expect(pass).to.changeAST(
            "start = &'a' !'b'",
            {
                rules: [
                    {
                        type: "rule",
                        inferredType: "[undefined,undefined]",
                        expression: {
                            type: "sequence",
                            inferredType: "[undefined,undefined]",
                            elements: [
                                { type: 'simple_and', inferredType: 'undefined' },
                                { type: 'simple_not', inferredType: 'undefined' }
                            ]
                        }
                    }
                ]
            }
        );
    });

    it('Text', function() {
        expect(pass).to.changeAST(
            "start = $('a'+ 'b'* ('c' / 'd'))",
            {
                rules: [
                    {
                        type: "rule",
                        inferredType: "string"
                    }
                ]
            }
        );
    });

} );
