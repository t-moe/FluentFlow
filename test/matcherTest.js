var CorePath = process.env.GPXPARSE_COV ? 'core-cov' : 'core';
var Matcher = require('../' + CorePath + '/matcher.js');

exports.testMatches = function (test) {
  var pkt = [
    {foo: 1},
    {foo: 3, bar: 3},
    {foo: 2},
    {bar: 1}
  ];

  var matches = {0: [], 1: []};

  var rules = {
    0: new Matcher.Rule(function (p) {
      test.equal(arguments.length, 1);
      return p.foo >= 2;
    }, function (p) {
      test.equal(arguments.length, 1);
      matches[0].push(p);
    }),
    1: new Matcher.Rule(function (p) {
      test.equal(arguments.length, 1);
      return p.bar === 1 || p.foo === 1;
    }, function (p) {
      test.equal(arguments.length, 1);
      matches[1].push(p);
    })

  };

  var expectedMatches = {
    0: [ { foo: 3, bar: 3 },
      { foo: 2 } ],
    1: [ { foo: 1 },
    { bar: 1 } ] };

  var matcher = new Matcher();
  matcher.addRules(rules);

  test.deepEqual(matcher.rules, rules);

  for (var i = 0; i < pkt.length; i++) {
    matcher.matchNext(pkt[i]);
  }
  test.deepEqual(matches, expectedMatches);

  test.done();
};

exports.testPushTo = function (test) {
  var pkt = [
    {foo: 1},
    {foo: 22},
    {foo: 3, bar: 3},
    {foo: 2},
    {bar: 1},
    {bar: 7, foo: 3},
    {bar: 13},
    {bar: 88}
  ];

  var matches = {0: [], 1: [], 2: [], 3: []};

  var rules = {
    0: new Matcher.Rule(function (p) {
      test.equal(arguments.length, 1);
      return p.foo === 1;
    }, function (p) {
      test.equal(arguments.length, 1);
      matches[0].push(p);
    }),
    1: new Matcher.Rule(function (p) {
      test.equal(arguments.length, 1);
      return p.bar !== undefined;
    }, function (p) {
      test.equal(arguments.length, 1);
      matches[1].push(p);
    }),
    2: new Matcher.Rule(function (p) {
      test.equal(arguments.length, 1);
      return p.foo === 3;
    }, function (p, lp) {
      test.equal(arguments.length, 2);
      matches[2].push(Array.prototype.slice.call(arguments));
    }),
    3: new Matcher.Rule(function (p) {
      return p.bar === 88;
    }, function (p, lp) {
      test.ok(arguments.length >= 2 && arguments.length <= 3);
      matches[3].push(Array.prototype.slice.call(arguments));
    })
  };
  rules[0].pushTo.push(2);
  rules[0].pushTo.push(3);
  rules[1].pushTo.push(2);
  rules[2].conditional = true;
  rules[2].pushTo.push(3);
  rules[3].conditional = true;

  var expectedMatches = {
    0: [{ foo: 1 }],
    1: [{foo: 3, bar: 3},
        {bar: 1},
        {bar: 7, foo: 3},
        {bar: 13},
        {bar: 88} ],
    2: [[{foo: 3, bar: 3}, { foo: 1 }],
        [{bar: 7, foo: 3}, {foo: 3, bar: 3}],
        [{bar: 7, foo: 3}, { bar: 1 }]],
    3: [[{bar: 88}, { foo: 1 }],
        [{bar: 88}, {foo: 3, bar: 3}, { foo: 1 }],
        [{bar: 88}, {bar: 7, foo: 3}, {foo: 3, bar: 3}],
        [{bar: 88}, {bar: 7, foo: 3}, { bar: 1 }]]
  };

  var matcher = new Matcher();
  matcher.addRules(rules);

  test.deepEqual(matcher.rules, rules);

  for (var i = 0; i < pkt.length; i++) {
    matcher.matchNext(pkt[i]);
  }
  test.deepEqual(matches, expectedMatches);

  test.done();
};

exports.testComplexMatch = function (test) {
  var pkt = [
    {foo: 1},
    {foo: 22},
    {foo: 3, bar: 2},
    {foo: 3, bar: 3},
    {foo: 2},
    {bar: 1},
    {bar: 7, foo: 3},
    {bar: 13},
    {bar: 88}
  ];

  var matches = {0: [], 1: [], 2: [], 3: []};
  var matchArgs = [];

  var rules = {
    0: new Matcher.Rule(function (p) {
      test.equal(arguments.length, 1);
      return p.foo === 1;
    }, function (p) {
      test.equal(arguments.length, 1);
      matches[0].push(p);
    }),
    1: new Matcher.Rule(function (p) {
      test.equal(arguments.length, 1);
      return p.bar !== undefined;
    }, function (p) {
      test.equal(arguments.length, 1);
      matches[1].push(p);
    }),
    2: new Matcher.Rule(function (object, lastObject) {
      test.equal(arguments.length, 2);
      matchArgs.push(Array.prototype.slice.call(arguments));
      var cb = this.next;
      setTimeout(function () {
        cb(object.foo === 3 && (lastObject.bar === undefined || object.bar === undefined || lastObject.bar + 4 === object.bar));
      }, 0);
    }, function (p, lp) {
      test.equal(arguments.length, 2);
      matches[2].push(Array.prototype.slice.call(arguments));
    }),
    3: new Matcher.Rule(function (p) {
      return p.bar === 88;
    }, function (p, lp) {
      test.ok(arguments.length >= 2 && arguments.length <= 3);
      matches[3].push(Array.prototype.slice.call(arguments));
    })
  };
  rules[0].pushTo.push(2);
  rules[0].pushTo.push(3);
  rules[1].pushTo.push(2);
  rules[2].conditional = true;
  rules[2].pushTo.push(3);
  rules[3].conditional = true;

  var expectedMatches = {
    0: [ { foo: 1 } ],
    1: [ {foo: 3, bar: 2},
         {foo: 3, bar: 3},
         {bar: 1},
         {bar: 7, foo: 3},
         {bar: 13},
         {bar: 88} ],
    2: [ [ {foo: 3, bar: 2}, { foo: 1 } ],
         [ {bar: 7, foo: 3}, {foo: 3, bar: 3} ] ],
    3: [ [ {bar: 88}, { foo: 1 } ],
         [ {bar: 88}, {foo: 3, bar: 2}, { foo: 1 } ],
         [ {bar: 88}, {bar: 7, foo: 3}, {foo: 3, bar: 3} ] ]
  };

  var expectedMatchArgs = [ // jep I copied this from the output and validated it by hand :)
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

  test.deepEqual(matcher.rules, rules);

  for (var i = 0; i < pkt.length; i++) {
    matcher.matchNext(pkt[i]);
  }
  test.deepEqual(matches, expectedMatches);
  test.deepEqual(matchArgs, expectedMatchArgs);

  test.done();
};

exports.testMultiChecker = function (test) {
  var pkt = [
    {bar: 33},
    {foo: 18},
    {foo: 1},
    {foo: 22},
    {foo: 3, bar: 3},
    {foo: 2},
    {bar: 1},
    {bar: 7, foo: 3},
    {bar: 13},
    {bar: 88}
  ];

  var objs = {0: [], 1: [], 2: [], 3: [], 4: []};

  var rule0 = new Matcher.Rule(function (p) {
    test.equal(arguments.length, 1);
    objs[0].push(p);
    return p.foo !== undefined;
  }, function (p) {
    test.equal(arguments.length, 1);
    objs[2].push(p);
  });

  rule0.checkers.push(function (p) {
    test.equal(arguments.length, 1);
    objs[1].push(p);
    return p.foo === 1;
  });
  rule0.pushTo.push(1);

  var rules = {
    0: rule0,
    1: new Matcher.Rule(function (p, lp) {
      test.equal(arguments.length, 2);
      objs[3].push(Array.prototype.slice.call(arguments));
      return p.bar !== undefined;
    }, function (p, lp) {
      test.equal(arguments.length, 2);
      objs[4].push(Array.prototype.slice.call(arguments));
    })
  };
  rules[1].conditional = true;

  var matcher = new Matcher();
  matcher.addRules(rules);

  test.deepEqual(matcher.rules, rules);

  for (var i = 0; i < pkt.length; i++) {
    matcher.matchNext(pkt[i]);
  }

  test.deepEqual(objs[0], pkt);
  test.deepEqual(objs[1], [
    {foo: 18},
    {foo: 1},
    {foo: 22},
    {foo: 3, bar: 3},
    {foo: 2},
    {bar: 7, foo: 3}
  ]);
  test.deepEqual(objs[2], [
    {foo: 1}
  ]);
  test.deepEqual(objs[3], [
    [ {foo: 22}, {foo: 1} ],
    [ {foo: 3, bar: 3}, {foo: 1} ]
  ]);

  test.deepEqual(objs[4], [
    [ {foo: 3, bar: 3}, {foo: 1} ]
  ]);

  test.done();
};

exports.testMultiChecker2 = function (test) {
  var pkt = [
    {foo: 33},
    {syscall: 88, id: 43},
    {foo: 1},
    {spawn: 22, owner: 43},
    {syscall: 91, id: 18},
    {spawn: 12, owner: 43},
    {spawn: 33, owner: 18},
    {spawn: 13, owner: 43},
    {spawn: 17, owner: 18},
    {spawn: 33, owner: 18},
    {syscall: 91, id: 20},
    {spawn: 813, owner: 43},
    {spawn: 1, owner: 20},
    {spawn: 13, owner: 20},
    {spawn: 87, owner: 18}
  ];

  var objs = [];

  var rule0 = new Matcher.Rule(function (p) {
    return !!p.syscall && p.syscall === 91;
  });

  var rule1 = new Matcher.Rule(function (p) {
    return !!p.spawn && !!p.owner;
  });
  rule1.checkers.push(function (p, lp) {
    return p.owner === lp.id;
  });

  rule1.actions.push(function (p, lp) {
    objs.push([p, lp]);
  });

  rule1.conditional = true;
  rule0.pushTo.push(1);

  var matcher = new Matcher();
  matcher.addRules({ 0: rule0, 1: rule1 });

  for (var i = 0; i < pkt.length; i++) {
    matcher.matchNext(pkt[i]);
  }

  test.deepEqual(objs, [
    [{ spawn: 33, owner: 18 }, { syscall: 91, id: 18 }],
    [{ spawn: 1, owner: 20 }, { syscall: 91, id: 20 }]
  ]);

  // Now we modify the checker function so that the queue is not automatically cleared. The rest stays the same.

  rule1.checkers[1] = function (p, lp) {
    this.cleanCurrent = false; // this line is missing in the test above
    return p.owner === lp.id;
  };

  objs = [];

  for (var j = 0; j < pkt.length; j++) {
    matcher.matchNext(pkt[j]);
  }

  console.log(objs);

  test.deepEqual(objs, [
    [ { spawn: 33, owner: 18 }, { syscall: 91, id: 18 } ],
    [ { spawn: 17, owner: 18 }, { syscall: 91, id: 18 } ],
    [ { spawn: 33, owner: 18 }, { syscall: 91, id: 18 } ],
    [ { spawn: 1, owner: 20 }, { syscall: 91, id: 20 } ],
    [ { spawn: 13, owner: 20 }, { syscall: 91, id: 20 } ],
    [ { spawn: 87, owner: 18 }, { syscall: 91, id: 18 } ]
  ]);

  test.done();
};

exports.testAsyncCheckerSynchronized = function (test) {
  var pkt = [
    {bar: 33},
    {foo: 18},
    {foo: 1},
    {foo: 22},
    {foo: 1, bar: 18},
    {bar: 13}
  ];

  var ind = 0;
  var ids = [];

  var rule0 = new Matcher.Rule(function (p) {
    var cb = this.next;
    ids.push([10, ind++]);
    setTimeout(function () {
      ids.push([11, ind++]);
      cb(p.foo !== undefined);
    }, 1);
  }, function (p) {
    ids.push([40, ind++]);
  });

  rule0.checkers.push(function (p) {
    ids.push([20, ind++]);
    return p.foo === 1;
  });
  rule0.checkers.push(function (p) {
    var cb = this.next;
    ids.push([30, ind++]);
    setTimeout(function () {
      ids.push([31, ind++]);
      cb(!!p.bar);
    }, 1);
  });

  var matcher = new Matcher();
  matcher.addRules([rule0]);

  for (var i = 0; i < pkt.length; i++) {
    matcher.matchNext(pkt[i]);
    ids.push([50, ind++]);
  }

  test.deepEqual(ids, [
    [ 10, 0 ], // {bar: 33}
    [ 11, 1 ],
    [ 50, 2 ],
    [ 10, 3 ], // {foo: 18}
    [ 11, 4 ],
    [ 20, 5 ],
    [ 50, 6 ],
    [ 10, 7 ], // {foo: 1}
    [ 11, 8 ],
    [ 20, 9 ],
    [ 30, 10 ],
    [ 31, 11 ],
    [ 50, 12 ],
    [ 10, 13 ], // {foo: 22}
    [ 11, 14 ],
    [ 20, 15 ],
    [ 50, 16 ],
    [ 10, 17 ], // {foo: 1, bar:18}
    [ 11, 18 ],
    [ 20, 19 ],
    [ 30, 20 ],
    [ 31, 21 ],
    [ 40, 22 ],
    [ 50, 23 ],
    [ 10, 24 ], // {bar: 13}
    [ 11, 25 ],
    [ 50, 26 ]
  ]);

  test.done();
};

exports.testAsyncCheckerCb = function (test) {
  // This test is equal to the test above, except that matcher.matchNext is used async (by passing a callback).

  var pkt = [
    {bar: 33},
    {foo: 18},
    {foo: 1},
    {foo: 22},
    {foo: 1, bar: 18},
    {bar: 13}
  ];

  var ind = 0;
  var ids = [];

  var rule0 = new Matcher.Rule(function (p) {
    var cb = this.next;
    ids.push([10, ind++]);
    setTimeout(function () {
      ids.push([11, ind++]);
      cb(p.foo !== undefined);
    }, 1);
  }, function (p) {
    ids.push([40, ind++]);
  });

  rule0.checkers.push(function (p) {
    ids.push([20, ind++]);
    return p.foo === 1;
  });
  rule0.checkers.push(function (p) {
    var cb = this.next;
    ids.push([30, ind++]);
    setTimeout(function () {
      ids.push([31, ind++]);
      cb(!!p.bar);
    }, 1);
  });

  var matcher = new Matcher();
  matcher.addRules([rule0]);

  var i = 0;

  var checkNext = function () {
    if (i > 0) {
      ids.push([50, ind++]);
    }
    if (i < pkt.length) {
      matcher.matchNext(pkt[i++], checkNext);
    } else {
      test.deepEqual(ids, [
        [ 10, 0 ], // {bar: 33}
        [ 11, 1 ],
        [ 50, 2 ],
        [ 10, 3 ], // {foo: 18}
        [ 11, 4 ],
        [ 20, 5 ],
        [ 50, 6 ],
        [ 10, 7 ], // {foo: 1}
        [ 11, 8 ],
        [ 20, 9 ],
        [ 30, 10 ],
        [ 31, 11 ],
        [ 50, 12 ],
        [ 10, 13 ], // {foo: 22}
        [ 11, 14 ],
        [ 20, 15 ],
        [ 50, 16 ],
        [ 10, 17 ], // {foo: 1, bar:18}
        [ 11, 18 ],
        [ 20, 19 ],
        [ 30, 20 ],
        [ 31, 21 ],
        [ 40, 22 ],
        [ 50, 23 ],
        [ 10, 24 ], // {bar: 13}
        [ 11, 25 ],
        [ 50, 26 ]
      ]);

      test.done();
    }
  };
  checkNext();
};

exports.testMatchNextReentrancy = function (test) {
  var rule0 = new Matcher.Rule(function () {
    return undefined; // signal async cb, but never return
  }, test.fail);

  var matcher = new Matcher();
  matcher.addRules([rule0]);

  var cb = test.fail;
  matcher.matchNext({}, cb); // start match with async rule above, shoudl never return

  test.throws(function () { // this block should throw
    matcher.matchNext({}, cb); // match another object, while the first one has not been finished;
  });

  test.done();
};

exports.testSet = function (test) {
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
  var set2 = new Matcher.Set(r5, r6);
  var ret = set2.receiveFrom(r7, set);

  test.equals(ret.size(), 4);
  test.deepEqual(r7.pushTo, [r5, r6]);
  test.deepEqual(r1.pushTo, [r4, r5, r6]);
  test.deepEqual(r2.pushTo, [r4, r5, r6]);
  test.deepEqual(r3.pushTo, [r4, r5, r6]);
  test.equal(r5.conditional, true);
  test.equal(r6.conditional, true);

  test.done();
};

exports.testSet2 = function (test) {
  var r1 = new Matcher.Rule();
  var r2 = new Matcher.Rule();
  var r3 = new Matcher.Rule();
  var r4 = new Matcher.Rule();
  var r5 = new Matcher.Rule();
  var r6 = new Matcher.Rule();

  var set = new Matcher.Set(r1, r2);
  var set2 = new Matcher.Set(r3, r4);
  var ret1 = set.pushTo(r5, set2, r6);
  var ret2 = set.pushTo(r6); // test if no duplicates are added

  test.deepEqual(ret1.size(), 4);
  test.deepEqual(ret2.at(0), r6);
  test.deepEqual(r1.pushTo, [r5, r3, r4, r6]);
  test.deepEqual(r2.pushTo, [r5, r3, r4, r6]);
  test.equal(r3.conditional, true);
  test.equal(r4.conditional, true);
  test.equal(r5.conditional, true);
  test.equal(r6.conditional, true);

  test.done();
};

exports.testMatchSyncRunntimeErrorInMatch = function (test) {
  var rules = {
    0: new Matcher.Rule(
      function (p) {
        0(); // runtime exception
      },
      function (p) { }
    )
  };

  var matcher = new Matcher();
  matcher.addRules(rules);

  test.throws(function () {
    matcher.matchNext({});
  });

  test.done();
};

exports.testMatchSyncRunntimeErrorInThen = function (test) {
  var rules = {
    0: new Matcher.Rule(
      function (p) {
        return true;
      },
      function (p) {
        0(); // runtime exception
      }
    )
  };

  var matcher = new Matcher();
  matcher.addRules(rules);

  test.throws(function () {
    matcher.matchNext({});
  });

  test.done();
};

exports.testMatchAsyncRunntimeErrorInMatch = function (test) {
  var rules = {
    0: new Matcher.Rule(
      function (p) {
        0(); // runtime exception
      },
      function (p) { }
    )
  };

  var matcher = new Matcher();
  matcher.addRules(rules);

  matcher.matchNext({}, function (err) {
    test.ok(err);
  });

  test.done();
};

exports.testMatchAsyncRunntimeErrorInThen = function (test) {
  var rules = {
    0: new Matcher.Rule(
      function (p) {
        return true;
      },
      function (p) {
        0(); // runtime exception
      }
    )
  };

  var matcher = new Matcher();
  matcher.addRules(rules);

  matcher.matchNext({}, function (err) {
    test.ok(err);
  });

  test.done();
};

exports.testBlocker = function (test) {
  var deasync = require('deasync');
  var ruleMatched = false;
  var thenCalled = false;
  var blockCalled = false;
  var cbCalled = false;
  var matchNextDone = false;

  var rules = {
    0: new Matcher.Rule(
      function (p) {
        deasync.sleep(10);

        test.ok(!ruleMatched);
        test.ok(!thenCalled);
        test.ok(!blockCalled);
        test.ok(!cbCalled);
        test.ok(!matchNextDone);

        ruleMatched = true;
        return true;
      },
      function (p) {
        var blocking = true;

        deasync.sleep(10);

        test.ok(ruleMatched);
        test.ok(!thenCalled);
        test.ok(!blockCalled);
        test.ok(!cbCalled);
        test.ok(!matchNextDone);

        thenCalled = true;
        setTimeout(function () { blocking = false; }, 100);
        return function () {
          deasync.sleep(10);

          test.ok(ruleMatched);
          test.ok(thenCalled);
          test.ok(!cbCalled);
          test.ok(!matchNextDone);

          blockCalled = true;
          return blocking;
        };
      }
    )
  };

  var matcher = new Matcher();
  matcher.addRules(rules);

  matcher.matchNext({}, function () {
    deasync.sleep(10);

    test.ok(ruleMatched);
    test.ok(thenCalled);
    test.ok(blockCalled);
    test.ok(!cbCalled);
    test.ok(!matchNextDone);

    cbCalled = true;
  });
  deasync.sleep(10);
  matchNextDone = true;

  test.ok(ruleMatched);
  test.ok(thenCalled);
  test.ok(blockCalled);
  test.ok(cbCalled);
  test.ok(matchNextDone);

  test.done();
};
