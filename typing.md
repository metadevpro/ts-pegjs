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
pegjs --plugin node_modules/ts-pegjs --format ts -o grammar.ts grammar.pegjs
```
Note that the module format is `ts`. This is the only format supported by the TS
plugin, since TypeScript has its own way of specifying exports.

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

A complete list of all type inference rules can be found in TBD.

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
    return dir*steps;
}
direction = 'forward' / 'backward';
number = digits:[0-9]+ <number>{ return parseInt(digits.join()); }
```


## Multiple Start Rules
pegjs allows for multiple start rules to be specified. However, at every invocation of the `parse` function, only one start rule has to be selected. From
the typing perspective, this fact has two implications. First, the `parse` function must accomodate for any of the allowed start rules. The type returned
by the `parse` function in this case will be the [Union Type](https://www.typescriptlang.org/docs/handbook/advanced-types.html) of the individual start rules. If all of the rule types are
identical, the return type will be that single type. There are some restrictions to this mechanism, identical to the rules
that apply to the *choice* element (Link TBD). The second implication i

# Reference
