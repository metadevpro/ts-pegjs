"use strict";

const chai = require( "chai" );
const helpers = require( "./helpers" );
const pass = require( "../../src/passes/infer-types");

chai.use( helpers );

const expect = chai.expect;

describe( "compiler pass |inferTypes|", function () {

    it('Code block with type specification', function() {
        expect(pass).to.changeAST(
            "start = 'x' <boolean>{}",
            {
                rules: [
                    {
                        name: "start",
                        expression: { type: "action" },
                        inferredType: 'T_start'
                    }
                ],
                ruleTypeMap: [
                    {
                        ruleName: 'start',
                        typeName: 'T_start',
                        ruleType: 'boolean'
                    }
                ]
            }
        );
    });

    it('Code block without type specification', function() {
        expect(pass).to.changeAST(
            "start = 'x' {}",
            {
                rules: [
                    {
                        name: "start",
                        expression: { type: "action" },
                        inferredType: "T_start"
                    }
                ],
                ruleTypeMap: [
                    {
                        ruleName: 'start',
                        typeName: 'T_start',
                        ruleType: 'any'
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
                        inferredType: 'T_start'
                    }
                ],
                ruleTypeMap: [
                    {
                        ruleName: 'start',
                        typeName: 'T_start',
                        ruleType: 'string'
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
                        inferredType: 'T_start'
                    }
                ],
                ruleTypeMap: [
                    {
                        ruleName: 'start',
                        typeName: 'T_start',
                        ruleType: 'string'
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
                        inferredType: 'T_rule1'
                    },
                    {
                        name: "rule2",
                        inferredType: 'T_rule2'
                    }
                ],
                ruleTypeMap: [
                    {
                        ruleName: 'rule1',
                        typeName: 'T_rule1',
                        ruleType: 'SomeType'
                    },
                    {
                        ruleName: 'rule2',
                        typeName: 'T_rule2',
                        ruleType: 'T_rule1'
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
                        inferredType: 'T_rule1'
                    },
                    {
                        name: "composite",
                        inferredType: 'T_composite'
                    },
                    {
                        name: "rule2",
                        inferredType: 'T_rule2'
                    },
                    {
                        name: "rule3",
                        inferredType: 'T_rule3'
                    }
                ],
                ruleTypeMap: [
                    {
                        ruleName: 'rule1',
                        typeName: 'T_rule1',
                        ruleType: 'string'
                    },
                    {
                        ruleName: 'composite',
                        typeName: 'T_composite',
                        ruleType: '[T_rule1,T_rule2,T_rule3]'
                    },
                    {
                        ruleName: 'rule2',
                        typeName: 'T_rule2',
                        ruleType: 'number'
                    },
                    {
                        ruleName: 'rule3',
                        typeName: 'T_rule3',
                        ruleType: 'string'
                    }
                ]
            }
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
                        inferredType: 'T_start'
                    }
                ],
                ruleTypeMap: [
                    {
                        ruleName: 'start',
                        typeName: 'T_start',
                        ruleType: '[string,string,string]'
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
                        inferredType: "T_start",
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
                ],
                ruleTypeMap: [
                    {
                        ruleName: 'start',
                        typeName: 'T_start',
                        ruleType: 'string'
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
                        inferredType: "T_start",
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
                ],
                ruleTypeMap: [
                    {
                        ruleName: 'start',
                        typeName: 'T_start',
                        ruleType: 'Type1|string'
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
                        inferredType: 'T_start',
                        expression: {
                            type: "optional",
                            expression: {
                                type: 'literal'
                            }
                        }
                    }
                ],
                ruleTypeMap: [
                    {
                        ruleName: 'start',
                        typeName: 'T_start',
                        ruleType: 'string|null'
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
                        inferredType: "T_start",
                        expression: {
                            type: "sequence",
                            inferredType: "[string[],string[]]",
                            elements: [
                                { type: 'one_or_more', inferredType: 'string[]' },
                                { type: 'zero_or_more', inferredType: 'string[]' }
                            ]
                        }
                    }
                ],
                ruleTypeMap: [
                    {
                        ruleName: 'start',
                        typeName: 'T_start',
                        ruleType: '[string[],string[]]'
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
                        inferredType: "T_start",
                        expression: {
                            type: "sequence",
                            inferredType: "[undefined,undefined]",
                            elements: [
                                { type: 'simple_and', inferredType: 'undefined' },
                                { type: 'simple_not', inferredType: 'undefined' }
                            ]
                        }
                    }
                ],
                ruleTypeMap: [
                    {
                        ruleName: 'start',
                        typeName: 'T_start',
                        ruleType: '[undefined,undefined]'
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
                        inferredType: "T_start"
                    }
                ],
                ruleTypeMap: [
                    {
                        ruleName: 'start',
                        typeName: 'T_start',
                        ruleType: 'string'
                    }
                ]
            }
        );
    });

    it('Semantic and/not', function() {
        expect(pass).to.changeAST(
            "start = &{ code1 } !{ code2 }",
            {
                rules: [
                    {
                        type: "rule",
                        inferredType: "T_start",
                        expression: {
                            type: "sequence",
                            inferredType: "[undefined,undefined]",
                            elements: [
                                { type: 'semantic_and', inferredType: 'undefined', code: " code1 " },
                                { type: 'semantic_not', inferredType: 'undefined', code: " code2 " }
                            ]
                        }
                    }
                ],
                ruleTypeMap: [
                    {
                        ruleName: 'start',
                        typeName: 'T_start',
                        ruleType: '[undefined,undefined]'
                    }
                ]
            }
        );
    });

    it('Any', function() {
        expect(pass).to.changeAST(
            "start = .",
            {
                rules: [
                    {
                        type: "rule",
                        inferredType: "T_start",
                        expression: { type: "any", inferredType: "string" }
                    }
                ],
                ruleTypeMap: [
                    {
                        ruleName: 'start',
                        typeName: 'T_start',
                        ruleType: 'string'
                    }
                ]
            }
        );
    });

    it('Group', function() {
        expect(pass).to.changeAST(
            "start = ('a' 'b')",
            {
                rules: [
                    {
                        type: "rule",
                        expression: {
                            type: "group",
                            inferredType: "[string,string]",
                            expression: {
                                type: "sequence",
                                inferredType: "[string,string]",
                                elements: [
                                    { type: "literal", inferredType: "string", value: "a" },
                                    { type: "literal", inferredType: "string", value: "b" }
                                ]
                            }
                        }
                    }
                ]
            }
        );
    });

    it('Named', function() {
        expect(pass).to.changeAST(
            "start 'some name' = 'a'",
            {
                rules: [
                    {
                        type: "rule",
                        inferredType: "T_start",
                        expression: {
                            type: "named",
                            expression: { type: "literal" }
                        }
                        
                    }
                ],
                ruleTypeMap: [
                    {
                        ruleName: 'start',
                        typeName: 'T_start',
                        ruleType: 'string'
                    }
                ]
            }
        );
    })

} );
