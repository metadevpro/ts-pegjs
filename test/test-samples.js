// Script for testing the arithmetics sample.
// Currently it just tests that SyntaxError.format
// works as advertised
const { parse } = require('../output/arithmetics');
const source = {
  grammarSource: 'somefile.txt',
  text: '3 ** 4'
};
try {
  parse(source.text, { grammarSource: source.grammarSource });
} catch (e) {
  const formattedError = e.format([source]);
  const expected = [
    'Error: Expected "(" or integer but "*" found.',
    ' --> somefile.txt:1:4',
    '  |',
    '1 | 3 ** 4',
    '  |    ^'
  ].join('\n');
  if (formattedError !== expected) {
    console.error('Test Failure: SyntaxError.format did not run correctly. Expected:');
    console.error(expected);
    console.error('\n\n... but got ...\n\n');
    console.error(formattedError);
    process.exit(1);
  }
}
