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
        2 : new Matcher.Rule(function(object,lastObject) {
            test.equal(arguments.length,2);
            matchArgs.push(Array.prototype.slice.call(arguments));
            var cb= this.next;
            setTimeout(function(){
                cb( object.foo==3 && (lastObject.bar==undefined || object.bar ==undefined ||  lastObject.bar+4 == object.bar));
            },0);

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

exports.testSet = function(test) {

    {
        var r1 = new Matcher.Rule();
        var r2 = new Matcher.Rule();
        var r3 = new Matcher.Rule();
        var r4 = new Matcher.Rule();

        var set = new Matcher.Set(r1);
        test.equal(set.size(), 1);
        test.equal(set.at(0), r1);

        set.append(r2, r3);
        test.equal(set.size(), 3);
        test.equal(set.at(1), r2);
        test.equal(set.at(2), r3);

        set.pushTo(r4);
        test.deepEqual(r1.pushTo, [r4]);
        test.deepEqual(r2.pushTo, [r4]);
        test.deepEqual(r3.pushTo, [r4]);
        test.equal(r4.conditional, true);

        var r5 = new Matcher.Rule();
        var r6 = new Matcher.Rule();
        var r7 = new Matcher.Rule();
        var set2 = new Matcher.Set(r5,r6);
        var ret = set2.receiveFrom(r7,set);

        test.equals(ret.size(),4);
        test.deepEqual(r7.pushTo,[r5,r6]);
        test.deepEqual(r1.pushTo, [r4,r5,r6]);
        test.deepEqual(r2.pushTo, [r4,r5,r6]);
        test.deepEqual(r3.pushTo, [r4,r5,r6]);
        test.equal(r5.conditional, true);
        test.equal(r6.conditional, true);
    }

    {

        var r1 = new Matcher.Rule();
        var r2 = new Matcher.Rule();
        var r3 = new Matcher.Rule();
        var r4 = new Matcher.Rule();
        var r5 = new Matcher.Rule();
        var r6 = new Matcher.Rule();
        var r7 = new Matcher.Rule();

        var set = new Matcher.Set(r1, r2);
        var set2 = new Matcher.Set(r3, r4);
        var ret1= set.pushTo(r5,set2,r6);
        var ret2 = set.pushTo(r6); //test if no duplicates are added

        test.deepEqual(ret1.size(),4);
        test.deepEqual(ret2.at(0),r6);
        test.deepEqual(r1.pushTo,[r5,r3,r4,r6]);
        test.deepEqual(r2.pushTo,[r5,r3,r4,r6]);
        test.equal(r3.conditional, true);
        test.equal(r4.conditional, true);
        test.equal(r5.conditional, true);
        test.equal(r6.conditional, true);

    }


    test.done();

};
