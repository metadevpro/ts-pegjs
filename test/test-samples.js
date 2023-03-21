// Script for testing the arithmetics sample.
// Currently it just tests that PeggySyntaxError.format
// works as advertised
import * as arithmetics from '../output/arithmetics.js';
const parse = arithmetics.parse;
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
    console.error('Test Failure: PeggySyntaxError.format did not run correctly. Expected:');
    console.error(expected);
    console.error('\n\n... but got ...\n\n');
    console.error(formattedError);
    process.exit(1);
  }
}
