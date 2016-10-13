const fs = require('fs');
const path = require('path');

const CorePath = process.env.GPXPARSE_COV ? 'core-cov' : 'core';
const Matchbox = require(path.join(__dirname, '..', CorePath, 'matchbox.js'));

const RULES = fs.readFileSync(path.join(__dirname, 'meta', 'stringRules.js'), {encoding: 'utf-8'});
const RULES_FAIL_SYNTAX = fs.readFileSync(path.join(__dirname, 'meta', 'stringRules_failSyntax.js'), {encoding: 'utf-8'});
const RULES_FAIL_RUNNTIME1 = fs.readFileSync(path.join(__dirname, 'meta', 'stringRules_failRunntime1.js'), {encoding: 'utf-8'});
const RULES_FAIL_RUNNTIME2 = fs.readFileSync(path.join(__dirname, 'meta', 'stringRules_failRunntime2.js'), {encoding: 'utf-8'});
const RULES_EMIT = fs.readFileSync(path.join(__dirname, 'meta', 'emitRules.js'), {encoding: 'utf-8'});

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
  objs.forEach(function (obj) {
    matchbox.matchNext(obj);
  });
  test.done();
};

exports.testMatchboxFailSyntax = function (test) {
  test.throws(function () {
    const matchbox = new Matchbox(RULES_FAIL_SYNTAX, {
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
  objs.forEach(function (obj) {
    matchbox.matchNext(obj);
  });
  test.done();
};

exports.testMatchboxFailSyntaxNoVM = function (test) {
  test.throws(function () {
    const matchbox = new Matchbox(RULES_FAIL_SYNTAX, {
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

exports.testMatchboxMatchSyncRunntimeExceptionInMatch = function (test) {
  const matchbox = new Matchbox(RULES_FAIL_RUNNTIME1, {
    console: 'off'
  });
  objs.forEach(function (obj) {
    test.throws(function () {
      matchbox.matchNext({});
    });
  });
  test.done();
};

exports.testMatchboxMatchSyncRunntimeExceptionInThen = function (test) {
  const matchbox = new Matchbox(RULES_FAIL_RUNNTIME2, {
    console: 'off'
  });
  objs.forEach(function (obj) {
    test.throws(function () {
      matchbox.matchNext({});
    });
  });
  test.done();
};

exports.testMatchboxMatchAsyncRunntimeExceptionInMatch = function (test) {
  const matchbox = new Matchbox(RULES_FAIL_RUNNTIME1, {
    console: 'off'
  });
  objs.forEach(function (obj) {
    matchbox.matchNext({}, function (err) {
      test.ok(err);
    });
  });
  test.done();
};

exports.testMatchboxMatchAsyncRunntimeExceptionInThen = function (test) {
  const matchbox = new Matchbox(RULES_FAIL_RUNNTIME2, {
    console: 'off'
  });
  objs.forEach(function (obj) {
    matchbox.matchNext({}, function (err) {
      test.ok(err);
    });
  });
  test.done();
};
