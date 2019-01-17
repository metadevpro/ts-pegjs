"use strict";

const chai = require( "chai" );
const parser = require('../../src/parser/parser');
const pass = require( "../../src/passes/generate-bytecode-ts");

const expect = chai.expect;

describe( "compiler pass |generateBytecodeTS|", function () {

    it('Constants are typed', function() {

        const grammar = 
            "start = a:rule1 b:rule2 <any>{ code1 }\n" +
            "rule1 = [abc]\n" +
            "rule2 = [def] <number>{ code2 }\n";

        const ast = parser.parse( grammar );

        
        ast.rules[0].inferredType = "any";
        ast.rules[1].inferredType = "string";
        ast.rules[2].inferredType = "number";
        ast.rules[0].expression.expression.elements[0].inferredType = "string";
        ast.rules[0].expression.expression.elements[1].inferredType = "number";
        pass ( ast );

        expect(ast).to.include.keys("consts");
        expect(ast.consts).to.include("function(a: string, b: number) { code1 }");

    });
});

