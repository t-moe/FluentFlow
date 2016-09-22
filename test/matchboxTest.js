const fs = require('fs');

const CorePath = process.env.GPXPARSE_COV ? 'core-cov' : 'core';
const Matchbox = require(__dirname + '/../' + CorePath + '/matchbox.js');

const RULES = fs.readFileSync(__dirname + '/meta/stringRules.js', {encoding: 'utf-8'});
const RULES_FAIL = fs.readFileSync(__dirname + '/meta/stringRules_fail.js', {encoding: 'utf-8'});
const RULES_EMIT = fs.readFileSync(__dirname + '/meta/emitRules.js', {encoding: 'utf-8'});

const objs = [
  {foo: 1},
  {foo: 3, bar: 3},
  {foo: 2},
  {bar: 1}
];

exports.testMatchbox = function (test) {
  const matchbox = new Matchbox(RULES, {
    console: 'off'
  });
  objs.forEach(function(obj){
    matchbox.matchNext(obj);
  });
  test.done();
};

exports.testMatchboxFail = function (test) {
  test.throws(function () {
    const matchbox = new Matchbox(RULES_FAIL, {
      console: 'off'
    });
    test.fail(); // should never reach this line.
    test.equal(matchbox, null);
  });
  test.done();
};

exports.testMatchboxEvents = function (test) {
  var log = 0;
  var error = 0;
  const matchbox = new Matchbox(RULES_EMIT, {
    console: 'redirect',
    events: {
      'console.log': function (data) {
        log++;
        test.equal(data, 'log');
      },
      'console.error': function (data) {
        error++;
        test.equal(data, 'error');
      }
    }
  });
  test.notEqual(matchbox, null);
  test.equal(log, 1);
  test.equal(error, 1);
  test.done();
};

exports.testMatchboxNoVM = function (test) {
  const matchbox = new Matchbox(RULES, {
    novm: true, // disable vm
    console: 'off'
  });
  objs.forEach(function(obj){
    matchbox.matchNext(obj);
  });
  test.done();
};

exports.testMatchboxFailNoVM = function (test) {
  test.throws(function () {
    const matchbox = new Matchbox(RULES_FAIL, {
      novm: true, // disable vm
      console: 'off'
    });
    test.fail(); // should never reach this line.
    test.equal(matchbox, null);
  });
  test.done();
};

exports.testMatchboxEventsNoVM = function (test) {
  var log = 0;
  var error = 0;
  const matchbox = new Matchbox(RULES_EMIT, {
    novm: true, // disable vm
    console: 'redirect',
    events: {
      'console.log': function (data) {
        log++;
        test.equal(data, 'log');
      },
      'console.error': function (data) {
        error++;
        test.equal(data, 'error');
      }
    }
  });
  test.notEqual(matchbox, null);
  test.equal(log, 1);
  test.equal(error, 1);
  test.done();
};
