/**
 * Created by Timo on 27.02.2016.
 */
var Fluent = require("../core/fluent.js");
var Matcher = require("../core/matcher.js");
var packet = Fluent.packet;
var when = Fluent.when;

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

    var t2 = t1.and.matchOn(y);
    test.equals(t2.steps.length,1);
    test.equals(t2.steps[0].rules.size(),2);
    test.equals(t2.steps[0].actions.length,0);
    test.equals(t2.steps[0].rules.at(0),x);
    test.equals(t2.steps[0].rules.at(1),y);

    var t3 = t2.and.matchOn(z);
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
    var s1 = when.matchOn(x).and.matchOn(y).and.matchOn(z).then(f1).then(f2);
    test.equals(s1.steps[0].rules.size(),3);
    test.equals(s1.steps[0].actions.length,2);

    var s2 = s1.followedBy;
    test.equals(s2.steps.length,2);
    test.equals(s2.steps[1].rules.size(),0);
    test.equals(s2.steps[1].actions.length,0);

    var x2 = new Matcher.Rule();
    var y2 = new Matcher.Rule();
    var f3 = function () {};

    var t1 = s2.matchOn(x2).and.matchOn(y2).then(f3);
    test.equals(t1.steps[1].rules.at(0),x2);
    test.equals(t1.steps[1].rules.at(1),y2);
    test.equals(t1.steps[1].actions.length,1);

    test.done();
};

exports.testFluentPacket = function(test){

    test.equals(packet.field.tcp.props.field,"tcp");
    test.equals(packet.field.tcp.dstport.props.field,"tcp.dstport");
    test.equals(packet.field.tcp.srcport.props.field,"tcp.srcport");
    test.equals(packet.field.http.props.field,"http");
    test.equals(packet.field.http.header.props.field,"http.header");
    test.equals(packet.field.http.header.aaa.props.field,"http.header.aaa");
    test.equals(packet.field.http.body.props.field,"http.body");

    test.done();
};


/*
 console.log(packet().field("tcp.aaa"));
 console.log(packet().field());
 console.log(packet().field().tcp());
 console.log(packet().field().tcp().srcport());
 console.log(packet().field().tcp().srcport().equals(80)({}));
 console.log(packet().has());
 console.log(packet().has().field());
 console.log(packet().has().field().tcp());
 console.log(packet().has().field().tcp().dstport()({}));*/
