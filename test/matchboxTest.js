const fs = require('fs');
const Matchbox = require("../core/matchbox.js");

const RULES = fs.readFileSync(__dirname + '/meta/stringRules.js', {encoding: 'utf-8'});
const RULES_FAIL = fs.readFileSync(__dirname + '/meta/stringRules_fail.js', {encoding: 'utf-8'});

const objs = [
    {foo: 1},
    {foo: 3, bar: 3},
    {foo: 2},
    {bar: 1}
];

exports.testMatchbox = function(test) {
    const matchbox = new Matchbox(RULES);
    matchbox.match(objs);
    test.done();
};

exports.testMatchboxFail = function(test) { 
    test.throws(function(){
        const matchbox = new Matchbox(RULES_FAIL);
        matchbox.match(objs);
    });
    test.done();
}
