'use strict'

const { expect } = require('chai');
const compileAndRequire = require('./compileAndRequire');

describe('Tutorial Examples', function() {

    it('Simple rule type assignment', function(done) {
        const grammar = 'start = digits:[0-9]+ <number>{ return parseInt(digits.join()); }';

        compileAndRequire(grammar, `
        import { parse } from "./parser";
        const q: number = parse('123');        
        `)
        .then(result => {
            expect(result).to.have.length(0);

            return compileAndRequire(grammar, `
            import { parse } from "./parser";
            const q: string = parse('123');        
            `)
            })
        .then(result => {
            expect(result).to.have.length(1);
            expect(result[0].messageText).to.equal("Type 'number' is not assignable to type 'string'.");
            done();
        });
    });

    it('Code block argument types', function(done) {

        const grammar = `
        move = dir:direction " " steps:number <number>{
            const sign = dir === "forward"? 1 : -1;
            return sign*steps;
        }
        direction = 'forward' / 'backward';
        number = digits:[0-9]+ <number>{ return parseInt(digits.join()); }
        `

        const code = `
        import { parse } from './parser';
        //parse('123')
        `

        compileAndRequire(grammar, code)
        .then(result => {
            expect(result).to.have.length(0); 
            done();
        });
    });

    it('Multiple start rules', function(done) {
        const grammar = `
        as_number = digits:[0-9]+ <number>{ return parseInt(digits.join()); }
        as_string = digits:[0-9]+ <string>{ return digits.join() }
        `;

        const code = `
        import { parse, parseAsNumber, parseAsString } from './parser'

        const p1 = parse('123', { startRule: 'as_number' }); // p1 type is: number|string
        const p1num: number = <number>p1;
        const p1str: string = <string>p1;
        const p2: number = parseAsNumber('123');  // p2 type is: number
        const p3: string = parseAsString('123');  // p3 type is: string
        `;

        compileAndRequire(grammar, code, "--allowed-start-rules as_number,as_string")
        .then(result => {
            expect(result).to.have.length(0); 
            done();
        });

    })
});
