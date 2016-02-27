/**
 * Created by Timo on 27.02.2016.
 */
var Fluent = require("../core/fluent.js");
var packet = Fluent.packet;
var when = Fluent.when;

exports.testFluentOneStep = function(test) {
    var a = when();
    test.equals(a.steps.length,1);
    test.equals(a.steps[0].rules.length,0);
    test.equals(a.steps[0].actions.length,0);

    var x = {};
    var y = {};
    var z = {};
    var t1 = when().matchOn(x);
    test.equals(t1.steps.length,1);
    test.equals(t1.steps[0].actions.length,0);
    test.equals(t1.steps[0].rules.length,1);
    test.equals(t1.steps[0].rules[0],x);

    var t2 = t1.and.matchOn(y);
    test.equals(t2.steps.length,1);
    test.equals(t2.steps[0].rules.length,2);
    test.equals(t2.steps[0].actions.length,0);
    test.equals(t2.steps[0].rules[0],x);
    test.equals(t2.steps[0].rules[1],y);

    var t3 = t2.and.matchOn(z);
    test.equals(t3.steps.length,1);
    test.equals(t3.steps[0].rules.length,3);
    test.equals(t3.steps[0].actions.length,0);
    test.equals(t3.steps[0].rules[0],x);
    test.equals(t3.steps[0].rules[1],y);
    test.equals(t3.steps[0].rules[2],z);

    var f1 = function() {};
    var f2 = function() {};
    var t4 = t3.then(f1);
    test.equals(t4.steps[0].actions.length,1);
    test.equals(t4.steps[0].actions[0],f1);
    var t5 = t4.then(f2);
    test.equals(t5.steps[0].actions.length,2);
    test.equals(t5.steps[0].actions[0],f1);
    test.equals(t5.steps[0].actions[1],f2);

     test.done();
};

exports.testFluentTwoSteps = function(test) {

    var x = {};
    var y = {};
    var z = {};
    var f1 = function() {};
    var f2 = function() {};
    var s1 = when().matchOn(x).and.matchOn(y).and.matchOn(z).then(f1).then(f2);
    test.equals(s1.steps[0].rules.length,3);
    test.equals(s1.steps[0].actions.length,2);

    var s2 = s1.followedBy;
    test.equals(s2.steps.length,2);
    test.equals(s2.steps[1].rules.length,0);
    test.equals(s2.steps[1].actions.length,0);

    var x2 = {};
    var y2 = {};
    var f3 = function () {};

    var t1 = s2.matchOn(x2).and.matchOn(y2).then(f3);
    test.equals(s1.steps[0].rules.length,3);
    test.equals(s1.steps[0].actions.length,2);
    test.deepEqual(t1.steps[1].rules,{
        3: x2,
        4: y2
    });
    test.equals(t1.steps[1].actions.length,1);
    
    test.done();
};

