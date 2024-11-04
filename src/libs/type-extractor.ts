import type { ast } from 'peggy';
import * as peggy from 'peggy';
import prettierPluginTypescript from 'prettier/parser-typescript';
import prettier from 'prettier/standalone';
import { Project, ScriptTarget, ts } from 'ts-morph';
import { getUniqueName, isKeyword } from './get-unique-name';
import {
  escapedString,
  formatUnionType,
  getEnclosingFunction,
  isLiteral,
  wrapNodeInAsConstDeclaration
} from './helpers';
import { pruneCircularReferences } from './prune-circular-references';
import { snakeToCamel } from './snake-to-camel';

type Grammar = ast.Grammar;
type Expression = ast.Expression;
type Rule = ast.Rule;
type ActionExpression = ast.Action;
type Named = ast.Named;

/**
 * Header string that is inserted at the top of all autogenerated types.
 */
const TYPES_HEADER = `// These types were autogenerated by ts-pegjs
`;

/**
 * Source code that is inserted before processing with typescript to help typescript guess certain types.
 */
const SOURCE_HEADER = `
// Peggy has built-in globals that we want to be always declared.
declare const options: {};
declare function text(): string;
declare function location(): { source: string | undefined; start: { offset: number; line: number; column: number }; end: { offset: number; line: number; column: number } };
declare function offset(): { offset: number; line: number; column: number };
declare function range(): {source: string | undefined, start: number, end: number};

// We need an export, otherwise typescript will insist that "location" refers to "window.location"
export {};
`;

/**
 * Generate a _probably_ unique name based on the number `i`.
 * Calling this function with the same number produces the same name.
 *
 * The purpose of this function is to create unique names for type template parameters
 * to avoid collisions with other (possibly defined) type names.
 */
function uniqueTypeParam(i: number) {
  return `__T_${i}`;
}

type TypeExtractorOptions = {
  /**
   * Autogenerated types may be marked with the `readonly` keyword, as this
   * keyword is sometimes inserted during type generation. Setting this flag
   * causes the `readonly` keyword to be removed after processing.
   */
  removeReadonlyKeyword?: boolean;
  /**
   * Whether to force type names to be camel case. If `false`,
   * type names will be named the same as the rules from the Peggy grammar.
   */
  camelCaseTypeNames?: boolean;
};

/**
 * Object that handles type creation and extraction from
 * a Peggy Grammar. By default, type names are created from
 * Peggy grammar rules and converted to CamelCase.
 *
 * Example usage
 * ```
 * const typeExtractor = new TypeExtractor(peggyGrammar);
 * const fullTypescriptTypes = typeExtractor.getTypes();
 * const specificTypeForGrammarRule = typeExtractor.typeCache.get("RuleName");
 * ```
 */
export class TypeExtractor {
  grammar: Grammar;
  sourceHeader = SOURCE_HEADER;
  project = new Project({
    compilerOptions: {
      allowJs: true,
      target: ScriptTarget.ESNext,
      strict: true
    },
    skipAddingFilesFromTsConfig: true,
    skipFileDependencyResolution: true,
    useInMemoryFileSystem: true
  });
  nameMap: Map<string, string> = new Map();
  typeCache: Map<string, string> = new Map();
  options: TypeExtractorOptions = {
    removeReadonlyKeyword: true,
    camelCaseTypeNames: true
  };
  formatter = (str: string) => {
    try {
      return prettier.format(str, {
        parser: 'typescript',
        plugins: [prettierPluginTypescript]
      });
    } catch (e) {
      console.warn('Encountered error when formatting types with Prettier', e);
    }
    return str;
  };

  constructor(grammar: Grammar | string, options?: TypeExtractorOptions) {
    if (typeof grammar === 'string') {
      grammar = peggy.generate(grammar, { output: 'ast' });
    }
    this.grammar = grammar;
    Object.assign(this.options, options || {});
    this.#initSourceHeader();
    this.#initNameMap();
    this.#renameGrammarRules();
  }

  /**
   * Create typescript source code for the types in the grammar.
   *
   * @param typeOverrides - An object whose keys are rule names and values are types. These will override any computed type. They can be full typescript expressions (e.g. `Foo | Bar`).
   */
  getTypes(options?: { typeOverrides?: Record<string, string> }) {
    let { typeOverrides } = options || {};

    const file = this.project.createSourceFile('__types__.ts', TYPES_HEADER, { overwrite: true });

    const ensureCached = (rule: { name: string; type: string }): { name: string; type: string } => {
      // Save the type in case we want to retrieve individual rules later (e.g., for testing)
      let typeCacheString = `type ${rule.name} = ${rule.type}`;
      try {
        typeCacheString = this.formatter(typeCacheString).trim();
        if (typeCacheString.endsWith(';')) {
          typeCacheString = typeCacheString.slice(0, typeCacheString.length - 1);
        }
      } catch {
        // Purposely empty catch
      }
      this.typeCache.set(rule.name, typeCacheString);
      this.typeCache.set(this.nameMap.get(rule.name) || 'UNKNOWN', typeCacheString);
      return rule;
    };

    // XXX: For some reason adding all types at once with `file.addTypeAliases()` fails
    // while adding the types one-by-one succeeds...
    const _declarations = this.grammar.rules
      .map((rule) => {
        if (typeOverrides?.[rule.name]) {
          return ensureCached({
            name: rule.name,
            type: typeOverrides[rule.name]
          });
        }
        let type = this.getTypeForExpression(rule.expression);
        if (this.options.removeReadonlyKeyword) {
          type = type.replace(/readonly\s/g, '');
        }

        return ensureCached({
          name: rule.name,
          type
        });
      })
      .map((dec) => {
        return file.addTypeAlias(dec).setIsExported(true);
      });

    pruneCircularReferences(file);

    return this.formatter(file.getFullText());
  }

  /**
   * Rename all grammar rules and references
   * as specified in the name map.
   */
  #renameGrammarRules() {
    const nameMap = this.nameMap;
    function rename(node: Grammar | Rule | Expression | Named) {
      const type = node.type;
      switch (type) {
        case 'named':
          rename(node.expression);
          break;
        case 'grammar':
          node.rules.forEach(rename);
          break;
        case 'rule':
          node.name = nameMap.get(node.name) || 'RENAME_ERROR';
          rename(node.expression);
          break;
        case 'rule_ref':
          node.name = nameMap.get(node.name) || 'RENAME_ERROR';
          break;
        case 'sequence':
          node.elements.forEach(rename);
          break;
        case 'action':
          rename(node.expression);
          break;
        case 'choice':
          node.alternatives.forEach(rename);
          break;
        case 'group':
        case 'labeled':
        case 'one_or_more':
        case 'optional':
        case 'simple_and':
        case 'simple_not':
        case 'zero_or_more':
        case 'text':
          rename(node.expression);
          break;
        case 'any':
        case 'semantic_and':
        case 'semantic_not':
        case 'literal':
        case 'class':
          break;
        case 'repeated':
          rename(node.expression);
          if (node.delimiter) {
            rename(node.delimiter);
          }
          break;
        default: {
          const _unused: never = type;
          console.warn('Did not handle renaming of Peggy node with type', type);
        }
      }
    }
    rename(this.grammar);
  }

  /**
   * Create a map of Peggy grammar rules to their type names.
   * Depending on the options, this will convert names to CamelCase.
   */
  #initNameMap() {
    const newNames: [string, string][] = this.options.camelCaseTypeNames
      ? this.grammar.rules.map((rule) => [rule.name, snakeToCamel(rule.name)])
      : this.grammar.rules.map((rule) => [rule.name, rule.name]);
    // Make sure no generated names clash with Javascript/Typescript keywords
    const existingNames: Map<string, string> = new Map(newNames.map((n) => [n[1], n[0]]));
    for (let i = 0; i < newNames.length; i++) {
      const [oldName, newName] = newNames[i];
      if (isKeyword(newName)) {
        const nonClashingName = getUniqueName(newName, existingNames, true);
        existingNames.set(nonClashingName, newName);
        newNames[i] = [oldName, nonClashingName];
      }
    }

    // Take care not to clobber names that are already in CamelCase. They get priority.
    newNames.filter(([a, b]) => a === b).forEach(([a, b]) => this.nameMap.set(a, b));
    for (const [oldName, newName] of newNames) {
      if (this.nameMap.get(oldName) === newName) {
        // Name is already here. No need to add it twice.
        continue;
      }
      // If we made it here, we haven't put our new name into the list yet.
      // We must first check that is unique. Because we changed snake case to
      // CamelCase, we may have introduced name collisions.
      const nameProposal = getUniqueName(newName, this.nameMap);
      this.nameMap.set(oldName, nameProposal);
      this.nameMap.set(nameProposal, oldName);
    }
  }

  /**
   * Add the global initializer and the initializer code to
   * the header (the parts between `{...}` at the start of a grammar)
   */
  #initSourceHeader() {
    if (this.grammar.topLevelInitializer?.code) {
      // Insert extra semicolons incase the code boundaries were ambiguous
      this.sourceHeader +=
        '\n;// Global Initializer\n' + this.grammar.topLevelInitializer.code + '\n;\n';
    }
    if (this.grammar.initializer?.code) {
      // Insert extra semicolons incase the code boundaries were ambiguous
      this.sourceHeader += '\n;// Initializer\n' + this.grammar.initializer.code + '\n;\n';
    }
  }

  /**
   * Returns the best-guess type for an Expression node in the grammar.
   *
   * For example, a rule with definition `Foo = [a-z]` would be type `string`.
   * A rule with definition `Foo = Bar / Baz` would be type `Bar | Baz`.
   */
  getTypeForExpression(expr: Expression | Named): string {
    const type = expr.type;
    switch (type) {
      case 'named':
        return this.getTypeForExpression(expr.expression);
      // For each of these, we cannot get a narrower type.
      // any == `.` matches any character
      // class == `[char-range]`
      // text == `$(concatenated strings)`
      case 'any':
      case 'class':
      case 'text':
        return 'string';
      case 'literal':
        if (expr.ignoreCase) {
          return 'string';
        }
        return escapedString(expr.value);
      case 'rule_ref':
        return expr.name;
      case 'optional':
        return `(${this.getTypeForExpression(expr.expression)}) | null`;
      case 'zero_or_more':
      case 'one_or_more':
      case 'repeated':
        return `(${this.getTypeForExpression(expr.expression)})[]`;
      case 'choice':
        return formatUnionType(expr.alternatives.map((e) => `(${this.getTypeForExpression(e)})`));
      case 'sequence': {
        // If a sequence has a pluck operator, the type is the type
        // of that item. Otherwise, the type is an array of all items
        const pickedElement = expr.elements.find((e) => e.type === 'labeled' && e.pick);
        if (pickedElement) {
          return this.getTypeForExpression(pickedElement);
        }
        return `[ ${expr.elements.map((e) => this.getTypeForExpression(e)).join(' , ')} ]`;
      }
      case 'simple_and':
      case 'simple_not':
      case 'semantic_and':
      case 'semantic_not':
        return 'undefined';
      case 'group':
        return this.getTypeForExpression(expr.expression);
      case 'labeled':
        return this.getTypeForExpression(expr.expression);
      case 'action':
        return this._getTypeForAction(expr);
    }
    const unknownType: never = type;
    console.warn('Peggy node of type', unknownType, 'is currently not processed');
    return 'unknown';
  }

  _getTypeForAction(action: ActionExpression): string {
    const file = this.project.createSourceFile('__temp__.ts', this.sourceHeader, {
      overwrite: true
    });

    const expressions =
      action.expression.type === 'sequence' ? action.expression.elements : [action.expression];

    const labelNames = expressions.flatMap((e) => {
      if (e.type === 'labeled') {
        return [
          {
            name: e.label ?? 'UNKNOWN_LABEL',
            type: this.getTypeForExpression(e.expression)
          }
        ];
      }
      return [];
    });

    const func = file.addFunction({
      name: 'tmpFunc',
      statements: action.code,
      parameters: labelNames.map((l, i) => ({
        name: l.name,
        type: uniqueTypeParam(i)
      })),
      typeParameters: labelNames.map((l, i) => ({
        name: uniqueTypeParam(i),
        constraint: l.type
      }))
    });
    func
      .getBodyOrThrow()
      .getChildrenOfKind(ts.SyntaxKind.ReturnStatement)
      .forEach((r) => {
        const parent = getEnclosingFunction(r);
        if (!parent || parent.getStart() !== func.getStart()) {
          // We found a return statement that was nested in a subfunction...
          return;
        }
        const returnExpression = r.getExpression();
        if (isLiteral(returnExpression)) {
          wrapNodeInAsConstDeclaration(returnExpression);
        }
      });

    const returnType = func.getReturnType();
    // Now that we have the return type with generic parameters,
    // we replace those generic parameters explicitly.
    const finalType = file.addTypeAlias({
      name: 'tmpType',
      typeParameters: labelNames.map((l, i) => ({
        name: uniqueTypeParam(i)
      })),
      type: returnType.getText(func, ts.TypeFormatFlags.NoTruncation)
    });
    let finalTypeNode = finalType.getTypeNodeOrThrow();

    // A way to convert from generic params to the corresponding type.
    const paramsToType = new Map(labelNames.map((l, i) => [uniqueTypeParam(i), l.type]));

    // Substitute in the types of any type parameters
    if (finalTypeNode.isKind(ts.SyntaxKind.TypeReference)) {
      // If the type node consists solely of a type reference, we need to treat it differently,
      // since it has no decedents.
      const name = finalTypeNode.getTypeName();
      const identifier = name.getText();
      if (paramsToType.has(identifier)) {
        finalType.setType(paramsToType.get(identifier) || `ERROR`);
      }
    } else {
      finalTypeNode.forEachDescendant((c) => {
        if (c.isKind(ts.SyntaxKind.TypeReference)) {
          const name = c.getTypeName();
          const identifier = name.getText();
          if (paramsToType.has(identifier)) {
            c.replaceWithText(`(${paramsToType.get(identifier)})` || `ERROR`);
          }
        }
      });
    }

    finalTypeNode = finalType.getTypeNodeOrThrow();
    return finalTypeNode.getText();
  }
}
