"use strict";

const uniq = require('lodash.uniq');
const visitor = require('pegjs').compiler.visitor;
const { GrammarError } = require('pegjs');

const __hasOwnProperty = Object.prototype.hasOwnProperty;

/**
 * Check if any of the values in a sequence is false (undefined/null/0 etc...).
 * 
 * @param {*} seq An array
 * @returns true if any of the elements are false.
 */
function anyIsNull(seq) {
    return seq.reduce(( prev, v ) => prev || !v, false);
}

function doTypeInference(node, meta) {

    // If the node already has a calculated type, return it
    if (node.inferredType)
        return node.inferredType;

    let inferredType = null;
    switch(node.type) {

    case 'action':
        inferredType = node.typeSpec || "any";
        break;

    case 'rule':
        // Transparent - inherit from expression
        inferredType = doTypeInference(node.expression, meta);

        // Store the rule type in a map, so rule references can be
        // resolved.
        meta.ruleTypeMap[node.name] = inferredType;
        break;

    case 'labeled':
        // Transparent - inherit from the expression
        inferredType = doTypeInference(node.expression, meta);
        break;

    case 'rule_ref':
        inferredType = meta.ruleTypeMap[node.name];
        break;

    case 'literal':
        // Predefined type
        inferredType = 'string';
        break;

    case 'sequence':
        // An array of types (tuple)
        const elementTypes = node.elements.map(e => doTypeInference(e, meta))
        if (anyIsNull(elementTypes))
            inferredType = null;
        else
            inferredType = "[" + elementTypes.join(",") + "]";
        break;

    case 'choice':
        // Resolve the type of the alternatives
        const altTypes = node.alternatives.map(e => doTypeInference(e, meta))
        // If any of them is not resolvable, bail out
        if (anyIsNull(altTypes))
            inferredType = null;
        else {
            // Remove duplicates
            const t = uniq(altTypes);

            if (t.length === 1) {
                // All types are identical
                inferredType = t[0];
            }
            else {
                // Not all types identical - generate union type
                inferredType = t.join('|');
            }
        }
        break;
    }

    if (inferredType) {
        // Type has been resolved - cache it in the node
        node.inferredType = inferredType;
    }
    else {
        // Type is not resolve - advance the unresolved types counter
        meta.unresolvedCount += 1;
    }

    return inferredType;
}

function listUnresolvedRules( ast ) {

    const l = [];

    const findUnresolved = visitor.build( {
        rule( node ) {
            if (!node.inferredType)
                l.push( node.name );
        }
    });
    findUnresolved( ast );

    return l;
}

// Infers rule result type.
function inferTypes( ast ) {

    const meta = {
        unresolvedCount: 0,
        ruleTypeMap: {}
    };

    const inferencePass = visitor.build( {
        rule( node ) {

            doTypeInference(node, meta);
        }
    } );

    // Multi-pass type inference.
    // Multiple passes may be required because types of rules referenced by other rules
    // may not be available.

    // First pass
    inferencePass( ast );

    // Continue doing passes as long as we have unresolved types
    while(meta.unresolvedCount > 0) {
        const lastUnresolvedCount = meta.unresolvedCount
        meta.unresolvedCount = 0;
        inferencePass( ast );

        // The number of unresolved types must decrease in
        // every pass, otherwise we have a cyclic reference.
        if (meta.unresolvedCount >= lastUnresolvedCount) {
            const unresolvedRules = listUnresolvedRules( ast );
            throw new GrammarError(`Cyclic rule reference in: ${unresolvedRules.join(', ')}`);
        }
    }
}

module.exports = inferTypes;
