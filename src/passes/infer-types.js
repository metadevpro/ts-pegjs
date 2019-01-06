"use strict";

const assert = require('assert');
const visitor = require('pegjs').compiler.visitor;
const { GrammarError } = require('pegjs');

const __hasOwnProperty = Object.prototype.hasOwnProperty;

function doTypeInference(node) {

    // If the node already has a calculated type, return it
    if (node.inferredType)
        return inferredType;

    let inferredType = null;
    switch(node.type) {

    case 'rule':
        // Use a user-defined type, or inherit from the expression
        if (node.typeSpec)
            inferredType = node.typeSpec;
        else
            inferredType = doTypeInference(node.expression);
        break;

    case 'labeled':
    case 'action':
        // Transparent - inherit from the expression
        inferredType = doTypeInference(node.expression);
        break;

    case 'literal':
        // Predefined type
        inferredType = 'string[]';
        break;
    }

    // At this point, some kind of type must have been calculated
    assert(inferredType);

    // Store the type in the node
    node.inferredType = inferredType;

    return inferredType;
}

// Infers rule result type.
function inferTypes( ast ) {

    const rules = {};

    const check = visitor.build( {
        rule( node ) {

            // If the rule has an explicit type specification, it MUST have
            // a code block
            if (node.typeSpec) {
                if (node.expression.type !== 'action')
                    throw new GrammarError(`Rule "${name}" has an explicit type specification, but no code block at line ${node.location.start.line}, column ${node.location.start.column}`)
            }

            doTypeInference(node);
        }
    } );

    check( ast );

}

module.exports = inferTypes;
