const fs = require('fs');
const Matchbox = require("../core/matchbox.js");

const RULES1 = fs.readFileSync(__dirname + '/meta/stringRules.js', {encoding: 'utf-8'});

exports.testMatchbox = function(test) {

    var objs = [
        {foo: 1},
        {foo: 3, bar: 3},
        {foo: 2},
        {bar: 1}
    ];

    const matchbox = new Matchbox(RULES1);
    matchbox.match(objs);
    test.done();
};
