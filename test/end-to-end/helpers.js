"use strict"

const tss = require('typescript-simple');

module.exports = function ( chai, utils ) {

    chai.Assertion.addMethod('compileWithoutErrors', function() {
        let passed;
        let errorMessage;
    
        try {
            tss(this._obj, { module: "commonjs" });
            passed = true;
        }
        catch(e) {
            passed = false;
            errorMessage = e.message;
        }
    
        this.assert(passed,
            `expected TS code to compile without errors, but got ${errorMessage}`,
            "expected TS code to fail compilation but it didn't"
        )
    });
    
}
