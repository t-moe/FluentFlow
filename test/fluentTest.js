/**
 * Created by Timo on 27.02.2016.
 */
var Fluent = require('../core/fluent.js');
var Matcher = require('../core/matcher.js');
var $ = Fluent.Matcher().starter;

exports.testFluentOneStep = function (test) {
  test.ok($.steps instanceof Array);

  var x = new Matcher.Rule();
  var y = new Matcher.Rule();
  var t1 = $.match(x);
  test.equals(t1.steps.length, 1);
  test.equals(t1.steps[0].startSet.size(), 1);
  test.equals(t1.steps[0].startSet.at(0), x);
  test.equals(t1.steps[0].endSet.size(), 1);
  test.equals(t1.steps[0].endSet.at(0), x);

  var t2 = $.oneOf($.match(x), $.match(y));
  test.equals(t2.steps[0].startSet.size(), 2);
  test.equals(t2.steps[0].startSet.at(0), x);
  test.equals(t2.steps[0].startSet.at(1), y);
  test.equals(t2.steps[0].endSet.size(), 2);
  test.equals(t2.steps[0].endSet.at(0), x);
  test.equals(t2.steps[0].endSet.at(1), y);

  var f1 = function () {};
  var t4 = t2.then(f1);
  test.equals(x.actions.length, 1);
  test.equals(x.actions[0], f1);
  test.equals(y.actions.length, 1);
  test.equals(y.actions[0], f1);

  var f2 = function () {};
  var f3 = function () {};

  t4.then(f2, f3);
  test.deepEqual(x.actions, [f1, f2, f3]);
  test.deepEqual(y.actions, [f1, f2, f3]);

  test.equals($.steps.length, 0);

  test.done();
};

exports.testFluentTwoSteps = function (test) {
  var x = new Matcher.Rule();
  var y = new Matcher.Rule();
  var z = new Matcher.Rule();
  var f1 = function () {};
  var f2 = function () {};
  var s1 = $.oneOf($.match(x), $.match(y), $.match(z)).then(f1).then(f2);
  test.equals(s1.steps[0].startSet.size(), 3);
  test.equals(s1.steps[0].endSet.size(), 3);
  test.deepEqual(x.actions, [f1, f2]);
  test.deepEqual(y.actions, [f1, f2]);
  test.deepEqual(z.actions, [f1, f2]);

  var x2 = new Matcher.Rule();
  var y2 = new Matcher.Rule();
  var z2 = new Matcher.Rule();
  var f3 = function () {};

  var t1 = s1.followedBy.oneOf($.match(x2), $.match(y2).followedBy.match(z2)).then(f3);
  test.equals(t1.steps.length, 2);
  test.equals(t1.steps[1].startSet.at(0), x2);
  test.equals(t1.steps[1].startSet.at(1), y2);
  test.equals(t1.steps[1].endSet.at(0), x2);
  test.equals(t1.steps[1].endSet.at(1), z2);

  var fin = new Matcher.Rule();
  t1.followedBy.match(fin).end(); // compiles the chain and makes the connections between the rules

  test.deepEqual(x.pushTo, [x2, y2]);
  test.deepEqual(y.pushTo, [x2, y2]);
  test.deepEqual(z.pushTo, [x2, y2]);
  test.deepEqual(x2.pushTo, [fin]);
  test.deepEqual(y2.pushTo, [z2]);
  test.deepEqual(z2.pushTo, [fin]);

  test.done();
};

exports.testFluentObject = function (test) {
  var f = Fluent.Object({
    'tcp': ['srcport', 'dstport'],
    'http': {
      'header': ['aaa', 'bbb'],
      'body': []
    }
  });
  var currentObject = f.currentObject;
  var lastObject = f.lastObject;

  test.equals(currentObject.field.tcp, 'tcp');
  test.equals(currentObject.field.tcp.dstport, 'tcp.dstport');
  test.equals(currentObject.field.tcp.srcport, 'tcp.srcport');
  test.equals(currentObject.field.http, 'http');
  test.equals(currentObject.field.http.header, 'http.header');
  test.equals(currentObject.field.http.header.aaa, 'http.header.aaa');
  test.equals(currentObject.field.http.body, 'http.body');

  test.equals(currentObject.field.tcp.dstport.equals(80), '(parseInt(object.tcp.dstport)===80)');
  test.equals(currentObject.field.tcp.dstport.equals(80).and.equals(81), '(parseInt(object.tcp.dstport)===80)&&(parseInt(object.tcp.dstport)===81)');
  test.equals(currentObject.field.tcp.dstport.equals(80).or.equals(81).and.equals(82), '(parseInt(object.tcp.dstport)===80)||(parseInt(object.tcp.dstport)===81)&&(parseInt(object.tcp.dstport)===82)');
  test.equals(lastObject.field.tcp.dstport.equals(80).and.equals(81), '(parseInt(lastobject.tcp.dstport)===80)&&(parseInt(lastobject.tcp.dstport)===81)');
  test.equals(currentObject.fieldNamed('a').equals(80).and.lastObject.fieldNamed('b').equals(81), '(parseInt(object.a)===80)&&(parseInt(lastobject.b)===81)');
  test.equals(lastObject.fieldNamed('a').equals(80).and.currentObject.fieldNamed('b').equals(81), '(parseInt(lastobject.a)===80)&&(parseInt(object.b)===81)');

  test.equals(currentObject.fieldNamed('a').equals(currentObject), '(object.a===object.a)');
  test.equals(currentObject.fieldNamed('a').equals(lastObject), '(object.a===lastobject.a)');
  test.equals(currentObject.fieldNamed('a').equals(currentObject.fieldNamed('b')), '(object.a===object.b)');
  test.equals(currentObject.fieldNamed('a').equals(lastObject.fieldNamed('b')), '(object.a===lastobject.b)');
  test.equals(lastObject.fieldNamed('a').equals(currentObject.fieldNamed('b')), '(lastobject.a===object.b)');
  test.equals(lastObject.fieldNamed('a').equals(currentObject), '(lastobject.a===object.a)');

  test.done();
};
