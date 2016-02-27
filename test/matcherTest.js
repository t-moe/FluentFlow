var Matcher = require("../core/matcher.js");



exports.testMatches = function(test) {

    var pkt = [
        {foo: 1},
        {foo: 3, bar: 3},
        {foo: 2},
        {bar: 1}
    ];

    var matches = {0:[],1:[]};

    var rules = {
        0 : new Matcher.Rule(function(p) {
            test.equal(arguments.length,1);
            return  p.foo>= 2;
        }, function(p) {
            test.equal(arguments.length,1);
            matches[0].push(p);
        } ),
        1 : new Matcher.Rule(function(p) {
            test.equal(arguments.length,1);
            return  p.bar==1 || p.foo==1;
        }, function(p) {
            test.equal(arguments.length,1);
            matches[1].push(p);
        } )

    };

    var expectedMatches = {
        0: [ { foo: 3, bar: 3 },
            { foo: 2 } ],
        1: [ { foo: 1 },
            { bar: 1 } ] };


    var matcher = new Matcher();
    matcher.addRules(rules);

    test.deepEqual(matcher.rules,rules);

    for(var i=0; i<pkt.length; i++) {
        matcher.matchNext(pkt[i]);
    }
    test.deepEqual(matches,expectedMatches);


    test.done();


};

exports.testPushTo = function(test) {
    var pkt = [
        {foo: 1},
        {foo: 22},
        {foo: 3, bar: 3},
        {foo: 2},
        {bar: 1},
        {bar:7, foo:3},
        {bar:13},
        {bar:88}
    ];

    var matches = {0:[],1:[],2:[],3:[]};

    var rules = {
        0 : new Matcher.Rule(function(p) {
            test.equal(arguments.length,1);
            return  p.foo== 1;
        }, function(p) {
            test.equal(arguments.length,1);
            matches[0].push(p);
        } ),
        1 : new Matcher.Rule(function(p) {
            test.equal(arguments.length,1);
            return  p.bar != undefined;
        }, function(p) {
            test.equal(arguments.length,1);
            matches[1].push(p);
        } ),
        2 : new Matcher.Rule(function(p) {
            test.equal(arguments.length,1);
            return p.foo==3
        }, function(p,lp) {
            test.equal(arguments.length,2);
            matches[2].push(Array.prototype.slice.call(arguments));
        } ),
        3 : new Matcher.Rule(function(p) {
            return p.bar==88
        }, function(p,lp) {
            test.ok(arguments.length>=2 && arguments.length<=3);
            matches[3].push(Array.prototype.slice.call(arguments));
        } )
    };
    rules[0].pushTo.push(2);
    rules[0].pushTo.push(3);
    rules[1].pushTo.push(2);
    rules[2].conditional = true;
    rules[2].pushTo.push(3);
    rules[3].conditional = true;

    var expectedMatches = {
        0: [ { foo: 1 }],
        1: [ {foo: 3, bar: 3},
            {bar: 1},
            {bar:7, foo:3},
            {bar:13},
            {bar:88} ],
        2: [[{foo: 3, bar: 3},{ foo: 1 }],
            [{bar:7, foo:3},{foo: 3, bar: 3}],
            [{bar:7, foo:3},{ bar: 1 }]],
        3: [[{bar:88},{ foo: 1 }],
            [{bar:88},{foo: 3, bar: 3},{ foo: 1 }],
            [{bar:88},{bar:7, foo:3},{foo: 3, bar: 3}],
            [{bar:88},{bar:7, foo:3},{ bar: 1 }]]
    };


    var matcher = new Matcher();
    matcher.addRules(rules);

    test.deepEqual(matcher.rules,rules);

    for(var i=0; i<pkt.length; i++) {
        matcher.matchNext(pkt[i]);
    }
    test.deepEqual(matches,expectedMatches);


    test.done();
};

exports.testComplexMatch = function(test) {
    var pkt = [
        {foo: 1},
        {foo: 22},
        {foo: 3, bar: 2},
        {foo: 3, bar: 3},
        {foo: 2},
        {bar: 1},
        {bar:7, foo:3},
        {bar:13},
        {bar:88}
    ];

    var matches = {0:[],1:[],2:[],3:[]};
    var matchArgs = [];

    var rules = {
        0 : new Matcher.Rule(function(p) {
            test.equal(arguments.length,1);
            return  p.foo== 1;
        }, function(p) {
            test.equal(arguments.length,1);
            matches[0].push(p);
        } ),
        1 : new Matcher.Rule(function(p) {
            test.equal(arguments.length,1);
            return  p.bar != undefined;
        }, function(p) {
            test.equal(arguments.length,1);
            matches[1].push(p);
        } ),
        2 : new Matcher.Rule(function(packet,lastPacket) {
            test.equal(arguments.length,2);
            matchArgs.push(Array.prototype.slice.call(arguments));
            return packet.foo==3 && (lastPacket.bar==undefined || packet.bar ==undefined ||  lastPacket.bar+4 == packet.bar);
        }, function(p,lp) {
            test.equal(arguments.length,2);
            matches[2].push(Array.prototype.slice.call(arguments));
        } ),
        3 : new Matcher.Rule(function(p) {
            return p.bar==88
        }, function(p,lp) {
            test.ok(arguments.length>=2 && arguments.length<=3);
            matches[3].push(Array.prototype.slice.call(arguments));
        } )
    };
    rules[0].pushTo.push(2);
    rules[0].pushTo.push(3);
    rules[1].pushTo.push(2);
    rules[2].conditional = true;
    rules[2].pushTo.push(3);
    rules[3].conditional = true;

    var expectedMatches = {
        0: [ { foo: 1 }],
        1: [{foo: 3, bar: 2},
            {foo: 3, bar: 3},
            {bar: 1},
            {bar:7, foo:3},
            {bar:13},
            {bar:88} ],
        2: [[{foo: 3, bar: 2},{ foo: 1 }],
            [{bar:7, foo:3},{foo: 3, bar: 3}]],
        3: [[{bar:88},{ foo: 1 }],
            [{bar:88},{foo: 3, bar: 2},{ foo: 1 }],
            [{bar:88},{bar:7, foo:3},{foo: 3, bar: 3}]]
    };

    var expectedMatchArgs = [ //jep I copied this from the output and validated it by hand :)
        [ { foo: 22 }, { foo: 1 } ],
        [ { foo: 3, bar: 2 }, { foo: 1 } ],
        [ { foo: 3, bar: 3 }, { foo: 3, bar: 2 } ],
        [ { foo: 2 }, { foo: 3, bar: 2 } ],
        [ { foo: 2 }, { foo: 3, bar: 3 } ],
        [ { bar: 1 }, { foo: 3, bar: 2 } ],
        [ { bar: 1 }, { foo: 3, bar: 3 } ],
        [ { bar: 7, foo: 3 }, { foo: 3, bar: 2 } ],
        [ { bar: 7, foo: 3 }, { foo: 3, bar: 3 } ],
        [ { bar: 7, foo: 3 }, { bar: 1 } ],
        [ { bar: 13 }, { foo: 3, bar: 2 } ],
        [ { bar: 13 }, { bar: 1 } ],
        [ { bar: 13 }, { bar: 7, foo: 3 } ],
        [ { bar: 88 }, { foo: 3, bar: 2 } ],
        [ { bar: 88 }, { bar: 1 } ],
        [ { bar: 88 }, { bar: 7, foo: 3 } ],
        [ { bar: 88 }, { bar: 13 } ]
    ];



    var matcher = new Matcher();
    matcher.addRules(rules);

    test.deepEqual(matcher.rules,rules);

    for(var i=0; i<pkt.length; i++) {
        matcher.matchNext(pkt[i]);
    }
    test.deepEqual(matches,expectedMatches);
    test.deepEqual(matchArgs,expectedMatchArgs);

    test.done();
};