"use strict";

const chai = require( "chai" );
const helpers = require( "./helpers" );
const pass = require( "../../src/passes/infer-types");

chai.use( helpers );

const expect = chai.expect;

describe( "compiler pass |inferTypes|", function () {

    it('Fail on type spec without code block', function() {
        expect( pass ).to.not.reportError("start => string = somename:'a' { doSomething() }");
        expect( pass ).to.reportError("start => string = somename:'a'");
    })
   
} );
