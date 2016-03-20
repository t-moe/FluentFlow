const fs = require('fs');
const Matchbox = require(__dirname + "/../core/matchbox.js");

const RULES = fs.readFileSync(__dirname + '/meta/stringRules.js', {encoding: 'utf-8'});
const RULES_FAIL = fs.readFileSync(__dirname + '/meta/stringRules_fail.js', {encoding: 'utf-8'});
const RULES_EMIT = fs.readFileSync(__dirname + '/meta/emitRules.js', {encoding: 'utf-8'});

const objs = [
    {foo: 1},
    {foo: 3, bar: 3},
    {foo: 2},
    {bar: 1}
];

exports.testMatchbox = function(test) {
    const matchbox = new Matchbox(RULES, {
        console: 'off',
    });
    matchbox.matchNext(objs);
    test.done();
};

exports.testMatchboxFail = function(test) { 
    test.throws(function(){
        const matchbox = new Matchbox(RULES_FAIL, {
            console: 'off',
        });
    });
    test.done();
}

exports.testMatchboEvents = function(test) { 
    var log = 0;
    var error = 0;
    const matchbox = new Matchbox(RULES_EMIT, {
        console: 'redirect',
        events: {
            'console.log': function(data){
                log++;
                test.equal(data, 'log');
            },
            'console.error': function(data){
                error++;
                test.equal(data, 'error');
            }
        }
    });
    test.equal(log, 1);
    test.equal(error, 1);
    test.done();
}
