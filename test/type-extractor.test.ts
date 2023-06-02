import { describe, it, expect } from 'vitest';
import util from 'util';
import * as peggy from 'peggy';
import { listRuleNames } from '../src/libs/list-rules';
import { TypeExtractor } from '../src/libs/type-extractor';
import { snakeToCamel } from '../src/libs/snake-to-camel';

/* eslint-env jest */

// Make console.log pretty-print by default
const origLog = console.log;
console.log = (...args) => {
  origLog(...args.map((x) => util.inspect(x, false, 10, true)));
};

const parse = (source: string) => peggy.generate(source, { output: 'ast' });

const SIMPLE_GRAMMAR = `
      // Simple Arithmetics Grammar
      // ==========================
      //
      // Accepts expressions like "2 * (3 + 4)" and computes their value.
      
      expression
        = head:term tail:(_ ("+" / "-") _ term)* {
            return tail.reduce(function(result, element) {
              if (element[1] === "+") { return result + element[3]; }
              if (element[1] === "-") { return result - element[3]; }
            }, head);
          }
      
      term
        = head:factor tail:(_ ("*" / "/") _ factor)* {
            return tail.reduce(function(result, element) {
              if (element[1] === "*") { return result * element[3]; }
              if (element[1] === "/") { return result / element[3]; }
            }, head);
          }
      
      factor
        = "(" _ expr:expression _ ")" { return expr; }
        / integer
      
      integer "integer"
        = _ [0-9]+ { return parseInt(text(), 10); }
      
      _ "whitespace"
        = [ \\t\\n\\r]*
      `;
const SIMPLE_GRAMMAR2 = `
      a = "a" b:b? { return {x:'a', y:b}; }
      b = "b" a:a? { return {x:'b', y:a}; }
      `;
const SIMPLE_GRAMMAR3 = `
      a = "a" b:b? { return ['a', b]; }
      b = "b" a:a? { return ['b', a]; }
      `;
const SIMPLE_GRAMMAR3B = `
      a = "a" b:A? { return ['a', b]; }
      A = "A" a:a? { return ['A', a]; }
      `;
const SIMPLE_GRAMMAR4 = `
      expression
        = head:term tail:(_ ("+" / "-") _ @term)* { return {type: "add", contents: [head].concat(tail)} }
      
      term
        = head:factor tail:(_ ("*" / "/") _ @factor)* { return {type: "mul", contents: [head].concat(tail)} }
      
      factor
        = "(" _ expr:expression _ ")" {return expr}
        / integer
      
      integer "integer"
        = _ [0-9]+ { return parseInt(text(), 10); }
      
      _ "whitespace"
        = [ \\t\\n\\r]*
      `;

describe('Basic Type Extraction', () => {
  it('can parse a minimal grammar', () => {
    parse(`start="a"`);
  });
  it('can parse a simple grammar', () => {
    parse(SIMPLE_GRAMMAR);
  });
  it('can list grammar rules', () => {
    const grammar = parse(SIMPLE_GRAMMAR);
    expect(listRuleNames(grammar)).toEqual(['expression', 'term', 'factor', 'integer', '_']);
  });
  it('can generate types for AB grammar', () => {
    const typeExtractor = new TypeExtractor(SIMPLE_GRAMMAR2);
    typeExtractor.getTypes();
    expect(typeExtractor.typeCache.get('A')).toEqual(`type A = { x: "a"; y: B | null }`);
    expect(typeExtractor.typeCache.get('B')).toEqual(`type B = { x: "b"; y: A | null }`);
  });
  it('can generate types for AB grammar 2', () => {
    const typeExtractor = new TypeExtractor(SIMPLE_GRAMMAR3);
    typeExtractor.getTypes();
    expect(typeExtractor.typeCache.get('A')).toEqual(`type A = ["a", B | null]`);
    expect(typeExtractor.typeCache.get('B')).toEqual(`type B = ["b", A | null]`);
  });
  it('can generate types without renaming rules', () => {
    const typeExtractor = new TypeExtractor(SIMPLE_GRAMMAR2, {
      camelCaseTypeNames: false
    });
    typeExtractor.getTypes();
    expect(typeExtractor.typeCache.get('a')).toEqual(`type a = { x: "a"; y: b | null }`);
    expect(typeExtractor.typeCache.get('b')).toEqual(`type b = { x: "b"; y: a | null }`);
  });
  it('can generate types without name clash', () => {
    const typeExtractor = new TypeExtractor(SIMPLE_GRAMMAR3B);
    typeExtractor.getTypes();
    expect(typeExtractor.typeCache.get('a')).toEqual(`type A_1 = ["a", A | null]`);
    expect(typeExtractor.typeCache.get('A')).toEqual(`type A = ["A", A_1 | null]`);
  });
  it('type of pluck operator `@` computed correctly', () => {
    const typeExtractor = new TypeExtractor(`Start = "a" @"b"`);
    typeExtractor.getTypes();
    expect(typeExtractor.typeCache.get('Start')).toEqual(`type Start = "b"`);
  });
  it('can create type from simple return type', () => {
    const typeExtractor = new TypeExtractor(`Start = x:"a" { return x; }`);
    typeExtractor.getTypes();
    expect(typeExtractor.typeCache.get('Start')).toEqual(`type Start = "a"`);
  });
  it('can identify a returned string as a type literal', () => {
    const typeExtractor = new TypeExtractor(`Start = "a" { return "a"; }`);
    typeExtractor.getTypes();
    expect(typeExtractor.typeCache.get('Start')).toEqual(`type Start = "a"`);
  });
  it('can identify a returned number as a type literal', () => {
    const typeExtractor = new TypeExtractor(`Start = "a" { return 7; }`);
    typeExtractor.getTypes();
    expect(typeExtractor.typeCache.get('Start')).toEqual(`type Start = 7`);
  });
  it('returns the correct type for location()', () => {
    const typeExtractor = new TypeExtractor(`Start = "a" { return location(); }`);
    typeExtractor.getTypes();
    expect(typeExtractor.typeCache.get('Start')).toEqual(
      `type Start = {
  source: string | undefined;
  start: { offset: number; line: number; column: number };
  end: { offset: number; line: number; column: number };
}`
    );
  });
  it('optional rules return possibly null', () => {
    const typeExtractor = new TypeExtractor(`Start = "a"?`);
    typeExtractor.getTypes();
    expect(typeExtractor.typeCache.get('Start')).toEqual(`type Start = "a" | null`);
  });
  it('start rule is exported', () => {
    const typeExtractor = new TypeExtractor(`Start = "a"\nEnd = "b"`);
    const types = typeExtractor.getTypes();
    expect(types).toEqual(
      `// These types were autogenerated by ts-pegjs\nexport type Start = "a";\nexport type End = "b";\n`
    );
  });
  it('duplicate rules are removed', () => {
    const typeExtractor = new TypeExtractor(`Start = "a" / "a"`);
    typeExtractor.getTypes();
    expect(typeExtractor.typeCache.get('Start')).toEqual(`type Start = "a"`);
  });
  it('semantic predicates return undefined', () => {
    const typeExtractor = new TypeExtractor(`Start = "a" & "a"`);
    typeExtractor.getTypes();
    expect(typeExtractor.typeCache.get('Start')).toEqual(`type Start = ["a", undefined]`);
  });
  it('handles repetition operator', () => {
    const typeExtractor = new TypeExtractor(`Start = "a"|4|`);
    typeExtractor.getTypes();
    expect(typeExtractor.typeCache.get('Start')).toEqual(`type Start = "a"[]`);
  });
  it('renames rules referenced by repetition operator', () => {
    const typeExtractor = new TypeExtractor(`Start = b|4|\nb="a"`);
    typeExtractor.getTypes();
    expect(typeExtractor.typeCache.get('Start')).toEqual(`type Start = B[]`);
  });
  it('can override generated type', () => {
    const typeExtractor = new TypeExtractor(`Start = "a"`);
    typeExtractor.getTypes({ typeOverrides: { Start: 'string' } });
    expect(typeExtractor.typeCache.get('Start')).toEqual(`type Start = string`);
  });
  it('can detect a self-referencing type', () => {
    const typeExtractor = new TypeExtractor(`Start = "a" / B\nB = "b" / "(" @Start ")"`);
    const types = typeExtractor.getTypes();
    expect(types).toMatchInlineSnapshot(`
      "// These types were autogenerated by ts-pegjs
      export type Start = \\"a\\" | B;
      export type B = \\"b\\" | void;
      "
    `);
  });
  it('can detect a self-referencing type 2', () => {
    const typeExtractor = new TypeExtractor(`Start = "a" / B\nB = "b" / "(" @Start ")"\nEnd = "x" / Y\nY = "y" / "(" @End ")"`);
    const types = typeExtractor.getTypes();
    expect(types).toMatchInlineSnapshot(`
      "// These types were autogenerated by ts-pegjs
      export type Start = \\"a\\" | B;
      export type B = \\"b\\" | void;
      export type End = \\"x\\" | Y;
      export type Y = \\"y\\" | void;
      "
    `);
  });
});

describe('Util tests', () => {
  it('Can convert snake to camel case', () => {
    expect(snakeToCamel('foo')).toEqual('Foo');
    expect(snakeToCamel('foo_bar')).toEqual('FooBar');
    expect(snakeToCamel('foo__bar')).toEqual('FooBar');
    expect(snakeToCamel('_foo_bar')).toEqual('_FooBar');
    expect(snakeToCamel('_Foo_Bar')).toEqual('_FooBar');
  });
});
