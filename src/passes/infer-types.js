"use strict";

const uniq = require('lodash.uniq');
const visitor = require('pegjs').compiler.visitor;
const { GrammarError } = require('pegjs');

const __hasOwnProperty = Object.prototype.hasOwnProperty;

/**
 * Computes the name of the generated type for a rule.
 * 
 * This is just a simple string transformation.
 * 
 * @param ruleName A name of a rule.
 * @returns A name of a type that will be used to represent this rule.
 */
function typeNameFromRule(ruleName) {
    return `T_${ruleName}`;
}

function doTypeInference(node) {

    // If the node already has a calculated type, return it
    if (node.inferredType)
        return node.inferredType;

    let inferredType = null;

    switch(node.type) {

    case 'action':
        // Continue the recursion. Assign type for this node only if the sub-nodes are resolved
        if (doTypeInference(node.expression)) 
            inferredType = node.typeSpec || "any";
        break;

    case 'rule':
        // Transparent - inherit from expression
        inferredType = doTypeInference(node.expression);
        break;

    case 'labeled':
    case 'group':
    case 'named':
        // Transparent - inherit from the expression
        inferredType = doTypeInference(node.expression);
        break;

    case 'rule_ref':
        // Use a computed type name for the type of the rule
        inferredType = typeNameFromRule(node.name);
        break;

    case "literal":
    case "text":
    case "any":
    case "class":
        // Predefined type
        inferredType = 'string';
        break;

    case 'sequence':
        // An array of types (tuple)
        const elementTypes = node.elements.map(e => doTypeInference(e))
        inferredType = "[" + elementTypes.join(",") + "]";
        break;

    case 'choice':
        // Resolve the type of the alternatives
        const altTypes = node.alternatives.map(e => doTypeInference(e))
        // Remove duplicates, create union type (textually)
        inferredType = uniq(altTypes).join('|');
        break;

    case "optional":
        // Either the type of the expression or null (if not specified)
        inferredType = doTypeInference(node.expression) + "|null";
        // TODO: In nested optional, "null" may appeare more than once
        break;

    case "zero_or_more":
    case "one_or_more":
        inferredType = doTypeInference(node.expression) + "[]";
        break;

    case "simple_and":
    case "simple_not":
    case "semantic_and":
    case "semantic_not":
        inferredType = "undefined";
        break;
    }

    if (inferredType) {
        // Type has been resolved - cache it in the node
        node.inferredType = inferredType;
    }

    return inferredType;
}

// Infers rule result type.
function inferTypes( ast ) {

    const ruleTypes = [];

    const inferencePass = visitor.build( {
        rule( node ) {

            const ruleType = doTypeInference(node);
            const typeName = typeNameFromRule(node.name);
            ruleTypes.push({
                ruleName: node.name,
                typeName, ruleType
            });

            // Replace the rule inferred type by its computed name
            node.inferredType = typeName;
        }
    } );

    // Do type inference
    inferencePass( ast );

    // Write the list of rules and their inferred types
    ast.ruleTypeMap = ruleTypes;
}

module.exports = inferTypes;
