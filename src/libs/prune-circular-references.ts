import { Diagnostic, SourceFile, ts, TypeNode, TypeReferenceNode } from 'ts-morph';

/**
 * Auto-generated types may contain circular references, like
 * ```typescript
 * type A = "a" | B
 * type B = "b" | A
 * ```
 * These circular references likely do not exist in the grammar (since it could produce
 * a parser with an infinite loop). They were likely created when inferring types for a grammar
 * like
 * ```
 * A = "a" / B
 * B = "b" / "(" A ")"
 * ```
 *
 * This function attempts to detect and remove these circular references.
 * @param file
 */
export function pruneCircularReferences(file: SourceFile) {
  // Diagnostic code `2456` is the code for circular type references
  let diagnostics = file.getPreEmitDiagnostics().filter((d) => d.getCode() === 2456);
  if (diagnostics.length === 0) {
    return;
  }

  // Circular references must be a loop of size at least two, so we can bound how many
  // times we must check for this error
  const maxLoops = diagnostics.length / 2;
  for (let i = 0; i < maxLoops; i++) {
    if (i > 0) {
      diagnostics = file.getPreEmitDiagnostics().filter((d) => d.getCode() === 2456);
    }
    if (diagnostics.length === 0) {
      return;
    }
    const info = diagnostics.map((d) => getInfoFromDiagnostic(d, file));

    // Eliminate the first thing
    const eliminateRefName = info[0].name;
    for (const typeInfo of info.slice(1)) {
      for (const typeRef of typeInfo.unionedIdentifiers) {
        if (typeRef.refName === eliminateRefName) {
          const node = typeRef.node;
          // We force the chain to be broken by inserting the `void` type.
          // Since this should occur in a union type anyways, there should be no effect.
          node.replaceWithText('void');
        }
      }
    }
  }
  diagnostics = file.getPreEmitDiagnostics().filter((d) => d.getCode() === 2456);
  if (diagnostics.length > 0) {
    console.warn(
      `Tried, but failed to eliminate circular references in generated types. The following errors remain: ${diagnostics
        .map((d) => d.getMessageText())
        .join('; ')}`
    );
  }
}

function getInfoFromDiagnostic(d: Diagnostic<ts.Diagnostic>, file: SourceFile) {
  const start = d.getStart();
  if (start == null) {
    throw new Error(`Diagnostic has no start position`);
  }
  const node = file.getDescendantAtPos(start);
  if (node == null) {
    throw new Error(`Cannot find node at position ${start}`);
  }
  const parent = node.getParentOrThrow();
  if (!parent.isKind(ts.SyntaxKind.TypeAliasDeclaration)) {
    throw new Error(
      `Parent of node is of kind "${parent.getKindName()}", not "TypeAliasDeclaration"`
    );
  }

  const typeBodyNode = parent.getTypeNodeOrThrow();
  if (!typeBodyNode.isKind(ts.SyntaxKind.UnionType)) {
    throw new Error(
      `Can only remove recursive type definitions on union types not "${typeBodyNode.getKindName()}"`
    );
  }

  return { name: node.getText(), unionedIdentifiers: listUnionedIdentifiers(typeBodyNode) };
}

function listUnionedIdentifiers(node: TypeNode): { refName: string; node: TypeReferenceNode }[] {
  if (node.isKind(ts.SyntaxKind.UnionType)) {
    return node.getTypeNodes().flatMap((n) => listUnionedIdentifiers(n));
  }
  if (node.isKind(ts.SyntaxKind.ParenthesizedType)) {
    return listUnionedIdentifiers(node.getTypeNode());
  }
  if (node.isKind(ts.SyntaxKind.TypeReference)) {
    return [{ refName: node.getText(), node }];
  }

  return [];
}
