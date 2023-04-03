/**
 * Convert from snake case to camel case, but preserve leading underscores.
 */
export function snakeToCamel(str: string): string {
  if (str.startsWith('_')) {
    return '_' + snakeToCamel(str.slice(1));
  }
  return str
    .split('_')
    .map((s) => capitalize(s))
    .join('');
}

function capitalize(str: string): string {
  if (str.length === 0) {
    return str;
  }
  if (str.charAt(0) !== str.charAt(0).toUpperCase()) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  return str;
}
