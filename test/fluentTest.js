/**
 * Created by Timo on 27.02.2016.
 */
var Fluent = require("../core/fluent.js");
var Matcher = require("../core/matcher.js");
var when = Fluent.Matcher().starter;

exports.testFluentOneStep = function(test) {

    test.equals(when.steps.length,1);
    test.equals(when.steps[0].rules.size(),0);
    test.equals(when.steps[0].actions.length,0);

    var x = new Matcher.Rule();
    var y = new Matcher.Rule();
    var z = new Matcher.Rule();
    var t1 = when.matchOn(x);
    test.equals(t1.steps.length,1);
    test.equals(t1.steps[0].actions.length,0);
    test.equals(t1.steps[0].rules.size(),1);
    test.equals(t1.steps[0].rules.at(0),x);

    var t2 = t1.or.matchOn(y);
    test.equals(t2.steps.length,1);
    test.equals(t2.steps[0].rules.size(),2);
    test.equals(t2.steps[0].actions.length,0);
    test.equals(t2.steps[0].rules.at(0),x);
    test.equals(t2.steps[0].rules.at(1),y);

    var t3 = t2.or.matchOn(z);
    test.equals(t3.steps.length,1);
    test.equals(t3.steps[0].rules.size(),3);
    test.equals(t3.steps[0].actions.length,0);
    test.equals(t3.steps[0].rules.at(0),x);
    test.equals(t3.steps[0].rules.at(1),y);
    test.equals(t3.steps[0].rules.at(2),z);

    var f1 = function() {};
    var f2 = function() {};
    var t4 = t3.then(f1);
    test.equals(t4.steps[0].actions.length,1);
    test.equals(t4.steps[0].actions[0],f1);
    var t5 = t4.then(f2);
    test.equals(t5.steps[0].actions.length,2);
    test.equals(t5.steps[0].actions[0],f1);
    test.equals(t5.steps[0].actions[1],f2);

    test.equals(when.steps.length,1);
    test.equals(when.steps[0].rules.size(),0);
    test.equals(when.steps[0].actions.length,0);


    test.done();
};

exports.testFluentTwoSteps = function(test) {

    var x = new Matcher.Rule();
    var y = new Matcher.Rule();
    var z = new Matcher.Rule();
    var f1 = function() {};
    var f2 = function() {};
    var s1 = when.matchOn(x).or.matchOn(y).or.matchOn(z).then(f1).then(f2);
    test.equals(s1.steps[0].rules.size(),3);
    test.equals(s1.steps[0].actions.length,2);

    var s2 = s1.followedBy;
    test.equals(s2.steps.length,2);
    test.equals(s2.steps[1].rules.size(),0);
    test.equals(s2.steps[1].actions.length,0);

    var x2 = new Matcher.Rule();
    var y2 = new Matcher.Rule();
    var f3 = function () {};

    var t1 = s2.matchOn(x2).or.matchOn(y2).then(f3);
    test.equals(t1.steps[1].rules.at(0),x2);
    test.equals(t1.steps[1].rules.at(1),y2);
    test.equals(t1.steps[1].actions.length,1);

    test.done();
};

exports.testFluentObject = function(test){

    var f = Fluent.Object({
            "tcp" : ["srcport","dstport"],
            "http": {
                "header" : ["aaa","bbb"],
                "body" : []
            }
        });
    var currentObject = f.currentObject;
    var lastObject = f.lastObject;

    test.equals(currentObject.field.tcp,"tcp");
    test.equals(currentObject.field.tcp.dstport,"tcp.dstport");
    test.equals(currentObject.field.tcp.srcport,"tcp.srcport");
    test.equals(currentObject.field.http,"http");
    test.equals(currentObject.field.http.header,"http.header");
    test.equals(currentObject.field.http.header.aaa,"http.header.aaa");
    test.equals(currentObject.field.http.body,"http.body");

    test.equals(currentObject.field.tcp.dstport.equals(80),"(parseInt(object.tcp.dstport)==80)");
    test.equals(currentObject.field.tcp.dstport.equals(80).and.equals(81),"(parseInt(object.tcp.dstport)==80)&&(parseInt(object.tcp.dstport)==81)");
    test.equals(currentObject.field.tcp.dstport.equals(80).or.equals(81).and.equals(82),"(parseInt(object.tcp.dstport)==80)||(parseInt(object.tcp.dstport)==81)&&(parseInt(object.tcp.dstport)==82)");
    test.equals(lastObject.field.tcp.dstport.equals(80).and.equals(81),"(parseInt(lastobject.tcp.dstport)==80)&&(parseInt(lastobject.tcp.dstport)==81)");
    test.equals(currentObject.fieldNamed("a").equals(80).and.lastObject.fieldNamed("b").equals(81),"(parseInt(object.a)==80)&&(parseInt(lastobject.b)==81)");
    test.equals(lastObject.fieldNamed("a").equals(80).and.currentObject.fieldNamed("b").equals(81),"(parseInt(lastobject.a)==80)&&(parseInt(object.b)==81)");

    test.equals(currentObject.fieldNamed("a").equals(currentObject),"(object.a==object.a)");
    test.equals(currentObject.fieldNamed("a").equals(lastObject),"(object.a==lastobject.a)");
    test.equals(currentObject.fieldNamed("a").equals(currentObject.fieldNamed("b")),"(object.a==object.b)");
    test.equals(currentObject.fieldNamed("a").equals(lastObject.fieldNamed("b")),"(object.a==lastobject.b)");
    test.equals(lastObject.fieldNamed("a").equals(currentObject.fieldNamed("b")),"(lastobject.a==object.b)");
    test.equals(lastObject.fieldNamed("a").equals(currentObject),"(lastobject.a==object.a)");

    test.done();
};
