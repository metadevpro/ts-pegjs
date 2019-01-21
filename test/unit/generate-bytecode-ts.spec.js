"use strict";

const chai = require( "chai" );
const parser = require('../../src/parser/parser');
const pass = require( "../../src/passes/generate-bytecode-ts");

const expect = chai.expect;

describe( "compiler pass |generateBytecodeTS|", function () {

    it('Constants are typed', function() {

        const grammar = 
            "start = a:rule1 b:rule2 <CustomType>{ code1 }\n" +
            "rule1 = [abc]\n" +
            "rule2 = v:[def] <number>{ code2 }\n";

        const ast = parser.parse( grammar );

        
        ast.rules[0].inferredType = "CustomType";
        ast.rules[1].inferredType = "string";
        ast.rules[2].inferredType = "number";
        ast.rules[0].expression.inferredType="CustomType"; // action of rule "start"
        ast.rules[2].expression.inferredType="number"; // action of rule "rule2"
        ast.rules[0].expression.expression.elements[0].inferredType = "string"; // element "a" of seq in rule "start"
        ast.rules[0].expression.expression.elements[1].inferredType = "number"; // element "b" of seq in rule "start"
        ast.rules[2].expression.expression.inferredType = "string"; // labeled inside rule2
        pass ( ast, { tspegjs: { strictTyping: true } });

        expect(ast).to.include.keys("consts");
        expect(ast.consts).to.include("function(a: string, b: number):CustomType { code1 }");
        expect(ast.consts).to.include("function(v: string):number { code2 }");


    });

    it('Constants are typed with any - compatibility mode', function() {

        const grammar = 
            "start = a:rule1 b:rule2 <CustomType>{ code1 }\n" +
            "rule1 = [abc]\n" +
            "rule2 = v:[def] <number>{ code2 }\n";

        const ast = parser.parse( grammar );

        
        ast.rules[0].inferredType = "CustomType";
        ast.rules[1].inferredType = "string";
        ast.rules[2].inferredType = "number";
        ast.rules[0].expression.inferredType="CustomType"; // action of rule "start"
        ast.rules[2].expression.inferredType="number"; // action of rule "rule2"
        ast.rules[0].expression.expression.elements[0].inferredType = "string"; // element "a" of seq in rule "start"
        ast.rules[0].expression.expression.elements[1].inferredType = "number"; // element "b" of seq in rule "start"
        ast.rules[2].expression.expression.inferredType = "string"; // labeled inside rule2
        pass ( ast );

        expect(ast).to.include.keys("consts");
        expect(ast.consts).to.include("function(a: any, b: any):any { code1 }");
        expect(ast.consts).to.include("function(v: any):any { code2 }");
    });

    it('Constants are typed - semantic predicate', function() {

        const grammar = 
            "start = a:[abc] b:rule1 &{ predicate code } <number>{ action code }\n" +
            "rule1 = v:[def] <CustomType>{ code }\n";

        const ast = parser.parse( grammar );
        
        ast.rules[1].inferredType = "CustomType";
        ast.rules[0].expression.inferredType = "number";
        ast.rules[0].expression.expression.elements[0].inferredType = "string";
        ast.rules[0].expression.expression.elements[1].inferredType = "CustomType";
        ast.rules[1].expression.expression.inferredType = "string";
        pass ( ast, { tspegjs: { strictTyping: true } });

        expect(ast).to.include.keys("consts");
        expect(ast.consts).to.include("function(a: string, b: CustomType):boolean { predicate code }");
        expect(ast.consts).to.include("function(a: string, b: CustomType):number { action code }");

    });

});

