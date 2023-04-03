import {
  ArrayLiteralExpression,
  ArrowFunction,
  FunctionDeclaration,
  FunctionExpression,
  Node,
  NumericLiteral,
  ObjectLiteralExpression,
  StringLiteral,
  ts,
  TypeNode
} from 'ts-morph';

/**
 * Wraps an expression in a `as const` declaration. E.g., `{foo: 1}` -> `{foo: 1} as const`
 */
export function wrapNodeInAsConstDeclaration(node: Node<ts.Expression>) {
  node.transform((t) =>
    t.factory.createAsExpression(
      node.compilerNode,
      t.factory.createTypeReferenceNode(t.factory.createIdentifier('const'))
    )
  );
}

/**
 * Returns the nearest enclosing function-like node. (E.g., a function declaration or arrow function, etc.)
 */
export function getEnclosingFunction(node: Node) {
  return node.getParentWhile((n) => !isFunctionLike(n))?.getParent() as
    | FunctionDeclaration
    | FunctionExpression
    | ArrowFunction
    | undefined;
}

/** Returns whether a node is function-like */
function isFunctionLike(
  node: Node
): node is FunctionDeclaration | FunctionExpression | ArrowFunction {
  return (
    node.isKind(ts.SyntaxKind.FunctionDeclaration) ||
    node.isKind(ts.SyntaxKind.FunctionExpression) ||
    node.isKind(ts.SyntaxKind.ArrowFunction)
  );
}

/**
 * Replace `typeNode` with an array of the same type.
 *
 * **Warning**: this function invalidates previous references to the type.
 * (E.g., if you obtained a reference via `typeDeclaration.getType()`, you must do so again,
 * because the old reference will be stale.)
 */
export function makeTypeAnArray(typeNode: TypeNode) {
  return typeNode.transform((traversal) =>
    traversal.factory.createArrayTypeNode(typeNode.compilerNode)
  );
}

/**
 * Replace `typeNode` with an union type including undefined.
 *
 * **Warning**: this function invalidates previous references to the type.
 * (E.g., if you obtained a reference via `typeDeclaration.getType()`, you must do so again,
 * because the old reference will be stale.)
 */
export function unionWithNull(typeNode: TypeNode) {
  return typeNode.transform((t) =>
    t.factory.createUnionTypeNode([
      typeNode.compilerNode,
      t.factory.createLiteralTypeNode(t.factory.createNull())
    ])
  );
}

/**
 * Determine if `node` is a literal. E.g. `[5,6]` or `{a: 7}` or `"foo"`.
 */
export function isLiteral(
  node: Node | undefined
): node is ObjectLiteralExpression | StringLiteral | ArrayLiteralExpression | NumericLiteral {
  if (!node) {
    return false;
  }
  return (
    node.isKind(ts.SyntaxKind.ObjectLiteralExpression) ||
    node.isKind(ts.SyntaxKind.StringLiteral) ||
    node.isKind(ts.SyntaxKind.ArrayLiteralExpression) ||
    node.isKind(ts.SyntaxKind.NumericLiteral)
  );
}

/**
 * Returns a union type with all duplicate entries removed.
 */
export function formatUnionType(subtypes: string[]): string {
  const uniqueTypes = Array.from(new Set(subtypes));
  return uniqueTypes.join(' | ');
}

/**
 * Safely "stringify" a string. This works in both Nodejs and
 * in the browser. All non-ascii characters are converted to
 * unicode escape sequences.
 */
export function escapedString(str: string): string {
  return JSON.stringify(str).replace(/[\u007F-\uFFFF]/g, function (chr) {
    return '\\u' + ('0000' + chr.charCodeAt(0).toString(16)).slice(-4);
  });
}
