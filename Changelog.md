# Changelog

## Version 2.0.1

- Added support for peggy 2.0.1
- Fix [#78](https://github.com/metadevpro/ts-pegjs/issues/78)
- Fix missing helper function
## Version 1.2.2

- Remove prod. dependency for peggy [#65](https://github.com/metadevpro/ts-pegjs/issues/65)
- Added more tests.
- Update libs.

## Version 1.2.1

- Fix src Type for IntelliJ [#70](https://github.com/metadevpro/ts-pegjs/issues/70).

## Version 1.2.0

- Add SyntaxError.format method [#67](https://github.com/metadevpro/ts-pegjs/issues/67).
- Now requires output to be ES6 at minimum (string.repeat needed).

## Version 1.1.1

2021.07.02

- Add missing file to package.json [#64](https://github.com/metadevpro/ts-pegjs/pull/64).

## Version 1.1.0

2021.07.02

- Small changes for peggy [#61](https://github.com/metadevpro/ts-pegjs/pull/61).
- Fixed peggy dependency version [#62](https://github.com/metadevpro/ts-pegjs/pull/62).
- Added top level initializer block [#63](https://github.com/metadevpro/ts-pegjs/pull/63).
- Update libs to latests versions.

## Version 1.0.0

2021.05.26

- Major change: [#59](https://github.com/metadevpro/ts-pegjs/issues/59). Changed dependency from [pegjs](https://github.com/pegjs/pegjs) (unmantained) in favour of [peggy](https://github.com/peggyjs/peggy) (a sensible mantained successor).

## Version 0.3.1

2021.02.09

- Fix [#53](https://github.com/metadevpro/ts-pegjs/issues/53). Errata in `--allowed-start-rules`.

## Version 0.3.0

2020.12.31

- Added ESLint for checking TS.
- Removed support for TSLint rules. Removed options: `noTslint` and `tslintIgnores`
