"use strict";

module.exports = {

    input: "src/grammer/parser.pegjs",
    output: "src/parser/parser.js",

    header: "/* eslint-disable */",

    dependencies: {

        ast: "../../pegjs/packages/pegjs/lib/ast",
        util: "../../pegjs/packages/pegjs/lib/ast"

    },

    features: {

        offset: false,
        range: false,
        expected: false,

    },

};
