import type { ast } from 'peggy';
type Grammar = ast.Grammar;

/**
 * Gets a list of all named rules from the grammar.
 */
export function listRuleNames(grammar: Grammar): string[] {
  return grammar.rules.map((r) => r.name);
}
