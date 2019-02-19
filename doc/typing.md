# Tutorial

## Quick start

Suppose we want to create a simple parser for positive integers (for sake of simplicity, we will ignore overflow problems). The
grammar for this kind of parser can be:

```
start = digits:[0-9]+ { return parseInt(digits.join()); }
```

Granted, the return type of the *start* rule (and the whole parser) is a number. We can specify the type expected to be
returned by a code in a code block by prefixing the code block with the type name, surrounded by angle brackets:

```
start = digits:[0-9]+ <number>{ return parseInt(digits.join()); }
```

The type, in this case, is a built-in primitive, but can be any type recognized by TypeScript, including interfaces,
type aliases or any valid combination of types.

The next step would be to compile the grammar into a TypeScript source code (assuming the grammar is located in the file `grammar.pegjs`):

```
pegjs --plugin node_modules/ts-pegjs --format commonjs -o grammar.ts grammar.pegjs
```
Note that the module format is `commonjs`. This is the only format supported by the TS
plugin.

Now, we have the generated parser at hand, and we can consume it using TypeScript's `import` command:

```TypeScript
import { parse } from './grammar';

const good: number = parse('123'); // This will compile
const bad: string = parse('123'); // This will fail
```

## Type Inference
In the example above, the type of the rule (and the entire parser) was explicitly specified. There are cases, in which types are automatically
deduced. This procedure is reffered to as *type inference*. For example:
```
natural = [+-]? [0-9]+
```

We have here a *sequence* of elements. The first element is a string that might
be either '+' or '-', but it's optional - so it can be `null` as well. The second
element of the sequence comprises of one or more strings. The type of the whole sequence is inferred to be a 
[tuple](https://www.typescriptlang.org/docs/handbook/basic-types.html#tuple) - that is, an array whose element types are
explicitly defined. The type of the first element would be `string|null` and the
type of the second element would be `string[]`. Therefore, the deduced type of
the whole rule will be: `[ string|null, string[] ]`.

A complete list of all type inference rules can be found in [Reference](#type-inference-rules) section.

## Code Block Argument Types
Types apply not only to the result of the whole parser, but also to arguments
passed internally to code blocks.

For example, the following rule:
```
somerule = a:[0-9] b:('*' [a-z]) { ... TS Code ... }
```
will be translated into a function that receives two arguments: `a` and `b`. The
argument `a` will receive the type `string`, and argument `b`, according to the
type inference rules, will be a tuple `[string,string]`, according to the type
inference rules.

In the case where the any of the rule specification parts refer to another rule,
the argument will receive the complete type of the rule being referenced, 
whether it was explicitly specified or deduced:

```
move = dir:direction " " steps:number <number>{
    // 'dir' is a string
    const sign = dir === "forward"? 1 : -1;

    // 'steps' is a number
    return sign*steps;
}
direction = 'forward' / 'backward';
number = digits:[0-9]+ <number>{ return parseInt(digits.join()); }
```


## Multiple Start Rules
pegjs allows for multiple start rules to be specified. However, at every invocation of the `parse` function, only one start rule has to be selected. From
the typing perspective, this fact means that the `parse` function must accomodate for any of the allowed start rules. The type returned
by the `parse` function in this case will be the [Union Type](https://www.typescriptlang.org/docs/handbook/advanced-types.html) of the individual start rules. If all of the rule types are
identical, the return type will be that single type. Some restrictions
apply, see the type inference rules of the [choice](#choice) element.

Another option is to use start rule specific parse function. pegjs-ts automatically generates a parse function for each allowed start rule. The name of the funcion is `parseRuleNmae`, whare `RuleName` is the name of the
specific rule, converted to Camel Case.

For example, suppose we have the following grammar (stored in the file `grammar.pegjs`):
```
as_number = digits:[0-9]+ <number>{ return parseInt(digits.join()); }
as_string = digits:[0-9]+ <string>{ return digits.join() }
```

We compile it using pegjs, allowing both rules to be start rules:
```
pegjs --plugin node_modules/ts-pegjs --format commonjs -o parser.ts  --allowed-start-rules as_number,as_string grammar.pegjs
```

Now, the parser can be used in any of the following forms:
```TypeScript
import { parse, parseAsNumber, parseAsString } from './parser'

const p1 = parse('123', { startRule: 'as_number' }); // p1 type is: number|string
const p2 = parseAsNumber('123');  // p2 type is: number
const p3 = parseAsString('123');  // p3 type is: string
```


# Reference

## Type Inference Rules

### Literal
A *literal* will be typed as `string`.

Example:
```
start = el:'abc' { 
    // Argument el has a type string
 }
```

### n-or-more
Both zero-or-more and one-or-more grammar specifications will be typed
as an array of the subject element.

Example:
```
start = el:[0-9]+ {
    // Argument el has a type string[]
}
```

### Optional
An optional element will be typed as the subject element or `null`.

Example:
```
start = el:[0-9]? {
    // Argument el has a type string|null
}
```

## Rule
A rule will receive either:
1. The type specified in its action block.
2. `any` if it has a code block without a type specification.
3. The inferred type the rule specification, if no code block is present.

Example:
```
rule1 = 'abc' <number>{}  // rule1 has a type number
rule2 = 'abc' {}          // rule2 has a type any
rule3 = 'abc'             // rule3 has a type string
```

### Rule Reference
A rule reference element will have the type of the rull it references.

Example:
```
start = el:rule1 {
    // Argument el has a type boolean
}
rule1 = 'abc' <boolean>{...}
```

### Sequence
A sequence will have a tuple type, consisting of the types of each individual
element it includes.

Example:
```
start = el:('abc' 'def'?) {
    // Argument el has a type [string,string|null]
}
```

### Choice
A choice will have a union type, consisting of the types of each
individual element it includes. Identical types are folded in such way
that they only appear once in the union type expression. As a consequence,
if the return type of all elements is identical, it will be assigned to the
result without the union operator. It must be noted that the comparison between
the different type is textual, not semantical, so it must be completely identical including whitespace.

Example:
```
// rule1 has a type number|string
rule1 = [0-9] <number>{} / [0-9] <string>{}

// rule2 has a type number|string
rule2 = [0-5] <number>{} / [6-9] <number>{} / [a-f] <string>{}

// rule3 has a type string
rule3 = [0-5] / [a-f]
```


### Match Operators (& and !)
The match operators produce value that cannot be consumed, therefore
they will be specified an `undefined` type if passed to code blocks as
arguments. 

Match operator with a predicate are special cases. The return type of the internal implementation
is specified to be `boolean`, but if such element is passed to a code block
as an argument, their type will be rendered as `undefine`.
