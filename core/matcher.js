/**
 * Created by Timo on 26.02.2016.
 */

var deasync = require('deasync');

module.exports = (function () {
  var log = function () {
    // Comment/uncomment for debug output
    // console.log.apply(this,arguments);
  };

  var error = function () {
    // Comment/uncomment for error output
    console.error.apply(this, arguments);
  };

  var obj = function () {
    this.addRules = function (rules) {
      if (!(this.rules)) {
        this.rules = {};
      }
      Object.assign(this.rules, rules);
      for (var i in this.rules) {
        this.rules[i].id = i;
      }
    };

    this.clearRules = function () {
      this.rules = [];
    };

    var isMatching = false;
    this.matchNext = function (object, cb) {
      const isAsync = !!cb;
      cb = cb || function () {};

      if (isMatching) {
        throw new Error('You cannot call matchNext while the previous call has not returned');
      }
      isMatching = true;

      if (typeof (cb) !== 'function') {
        throw new Error('Second argument must be a function (optional)');
      }

      var runtimeExceptions = [];
      function addRuntimeException (e) {
        error(e.toString());
        runtimeExceptions.push(e);
        if (!isAsync) throw e;
      }

      log('new object', object);

      var pushTo = { };
      var pushObjectTo = function (from, to, params) {
        log('request push from ' + from + ' to ' + to + ' params ', params);
        if (pushTo[to]) {
          if (pushTo[to][from]) {
            pushTo[to][from].push(params);
          } else {
            pushTo[to][from] = [params];
          }
        } else {
          pushTo[to] = {};
          pushTo[to][from] = [params];
        }
      };

      var asyncTasksStarted = 0;
      var asyncTasksRunning = 0;
      var self = this;
      var asyncDone = function () {
        if (asyncTasksStarted > 0) {
          if (asyncTasksRunning === 0) {
            throw new Error('AsyncDone called too many times');
          }
          asyncTasksRunning--;
        }

        if (asyncTasksRunning === 0) {
          for (var toWhere in pushTo) {
            var pushFrom = pushTo[toWhere];
            for (var fromWhere in pushFrom) {
              var params = pushFrom[fromWhere];
              log('before pushing from ' + fromWhere + ' to ' + toWhere, params);
              for (var ind in params) {
                self.rules[toWhere].params.push(params[ind]);
              }
              log('after pushing from ' + fromWhere + ' to ' + toWhere, params);
            }
          }
          isMatching = false;
          if (runtimeExceptions.length > 0) return cb(runtimeExceptions.join());
          cb();
        }
      };

      // Function that checks the current object against the passed rule
      // Function will first be called with only one argument: the rule to check
      // If one of the checker functions takes multiple parameters, and multiple ruleDef.params are available, the function will then be called for every ruleDef.param.
      var checkRule = function (ruleDef, param, ind, param2remove, cleanCurrent) {
        var ruleId = ruleDef.id;
        var checkerInd = ind || 0; // index of the next checker function to execute
        var hasParam = (param !== undefined);
        var asyncMode = false; // will be set to true as soon as one checker function returns undefined and starts using the async "next()" callback.

        var context = { // context that will be used as "this" object for the checker functions
          'queue': ruleDef.params, // All currently queued params. Can be modified by checkers and actions.
          'current': param2remove || null, // The object in queue which is related to the current check action.
          'cleanCurrent': cleanCurrent || ruleDef.autoCleanQueue // Whether or not "current" will be removed from "queue" after the rule matched and all actions have been executed
        };

        // Function that calls all callbacks of a ruleDef and pushes objects into following queues
        var afterMatch = function (params) {
          var copy = params.slice(); // make one copy for all action handlers
          var blockers = [];
          for (var i in ruleDef.actions) { // foreach action handler
            var blocker = [].concat(
              ruleDef.actions[i].apply(context, copy) || function () { return false; }
            );
            if (blocker.some(function (b) { return typeof b !== 'function'; })) throw new Error('Blocker must be a function or array of functions');
            blockers = blockers.concat(blocker);
          }
          for (i in blockers) { // foreach blocker
            deasync.loopWhile(blockers[i]);
          }
          if (ruleDef.pushTo.length > 0) {
            for (var k in ruleDef.pushTo) {
              var toWhere = ruleDef.pushTo[k];
              pushObjectTo(ruleId, toWhere, params.slice()); // make one copy per ruleDef
            }
          }
        };

        // Function that will be called when all checker function's returned true
        // Calls the callbacks and marks the async task's as finished
        var endCheck = function () {
          if (hasParam) {
            log('match on rule ' + ruleId + ' with param', param);
            afterMatch(param); // Call action, apply pushTo and unpushTo
            if (context.cleanCurrent) { // param must be removed
              var i = ruleDef.params.indexOf(param2remove);
              if (i >= 0) { // param has not been removed by checker/action yet
                ruleDef.params.splice(i, 1); // remove argument from ruleDef because it matched
              }
            }
          } else {
            log('match on rule ' + ruleId);
            if (ruleDef.params.length === 0) { // No "Arguments" available. Call action only once. No cleaning afterwards
              afterMatch([object]);
            } else { // Arguments available. Call action once per argument
              var prevCleanCurrent = context.cleanCurrent;
              var copy = ruleDef.params.slice();
              while (copy.length > 0) {
                var par2remove = copy.shift(); // remove first element
                context.cleanCurrent = prevCleanCurrent;
                context.current = par2remove;
                var par = par2remove.slice(); // make a copy of it
                par.unshift(object); // add object front
                afterMatch(par);
                if (context.cleanCurrent) {
                  var k = ruleDef.params.indexOf(par2remove);
                  if (k >= 0) { // param has not been removed by checker/action yet
                    ruleDef.params.splice(k, 1); // remove argument from ruleDef because it matched
                  }
                }
              }
            }
          }
          if (asyncMode) {
            asyncDone(); // mark rule check task as finished
          }
        };

        // Function that calls the next checker function and validates it's return value
        var checkNext = function (checker, args) {
          var funcReturned = false; // var that says whether or not the checker function has yet returned (sync OR async !!)
          context.next = function (matched) {
            if (funcReturned) {
              throw new Error('You can not call next() multiple times, or after you function returned a boolean');
            }
            funcReturned = true;
            if (matched === true) {
              continueCheck();
            } else if (matched === false) {
              if (asyncMode) {
                asyncDone(); // mark rule check task as finished
              }
            } else {
              log(ruleDef.checkers[checkerInd - 1].toString());
              throw new Error('Invalid argument to next() function. must be boolean');
            }
          };

          try {
            var retVal = checker.apply(context, args);
            if (typeof (retVal) === 'boolean') {
              if (funcReturned) {
                throw new Error('You cannot return a boolean, after you called next()');
              }
              context.next(retVal); // will decide what to do next and set funcReturned=true
            } else if (typeof (retVal) === 'undefined') {
              if (!funcReturned && !asyncMode) {
                asyncMode = true;
                asyncTasksStarted++;
                asyncTasksRunning++;
              }
            } else {
              throw new Error('Invalid return value of matcher function. must be boolean or undefined (async)');
            }
          } catch (e) {
            return addRuntimeException(e);
          }
        };

        // Function that executes the next step of checking of this rule or ends the checking with endCheck()
        var continueCheck = function () {
          if (checkerInd === ruleDef.checkers.length) { // was last checker
            endCheck();
            return;
          }
          var checker = ruleDef.checkers[checkerInd++]; // get current checker and increment for next round
          hasParam = hasParam || (checker.length > 1 && ruleDef.params.length > 0); // if the checker takes more than one argument, and we have more than one object to pass
          if (!hasParam) {
            checkNext(checker, [object]);
          } else if (param === undefined) {
            var params = ruleDef.params.slice(); // shadow copy, so that array will not shrink
            for (var paramInd = 0; paramInd < params.length; paramInd++) { // foreach param
              var par = params[paramInd].slice(); // copy param!
              par.unshift(object); // add object front
              log('try to match rule ' + ruleId + ' with args', par);
              checkRule(ruleDef, par, checkerInd - 1, params[paramInd], context.cleanCurrent);
            }
          } else {
            checkNext(checker, param);
          }
        };

        continueCheck(); // Start checking with the first checker
      };

      for (var ruleId in this.rules) { // foreach rule
        var ruleDef = this.rules[ruleId];
        if (!ruleDef.conditional || ruleDef.params.length > 0) { // Rule must be processed
          checkRule(ruleDef); // check one rule (async)
        }
      }

      if (asyncTasksStarted === 0) { // No Async tasks ever started
        asyncDone();
      } else if (isMatching && !isAsync) { // Async tasks running and no callback specified
        deasync.loopWhile(function () {
          return isMatching; // continue deasync's loopWhile as long as async tasks are runnning
        });
      }
    };
  };

  obj.Rule = function (rule, action) {
    this.id = null; // The id of the rule (will be autofilled after calling addRules())
    this.conditional = false; // if set to true the rule will only be executed if there are params available
    this.autoCleanQueue = true; // if set to true the queue will be cleared of all elements that matched the rule.
    this.params = []; // params objects (one entry = array of matches along the chain), those params shall be passed down the chain and to the action handlers
    this.checkers = rule ? [rule] : []; // rule check functions. First parameter: Current Object, Second Parameter: array of the previous objects down the chain
    this.actions = action ? [action] : []; // action handler functions which will be called on match. First parameter: Current Object, Second Parameter: array of the previous objects down the chain
    this.pushTo = []; // ruleid of rules to which params to push matches to. An entry "3" will push the all matches to the params of rule 3.
  };

  obj.Set = function () {
    this.data = [];
    this.append = function () {
      for (var i in arguments) {
        var arg = arguments[i];
        if (arg instanceof obj.Set) {
          for (var k in arg.data) {
            this.data.push(arg.data[k]);
          }
        } else if (arg instanceof obj.Rule) {
          this.data.push(arg);
        } else {
          throw new Error('invalid argument type');
        }
      }
    };
    this.at = function (i) {
      return this.data[i];
    };
    this.removeAt = function (i) {
      return this.data.splice(i, 1);
    };
    this.size = function () {
      return this.data.length;
    };

    this.pushTo = function (s) {
      for (var k in this.data) {
        var where = this.data[k];
        for (var i in arguments) {
          var what = arguments[i];
          if (what instanceof obj.Set) {
            what.receiveFrom(where);
          } else if (what instanceof obj.Rule) {
            what.conditional = true;
            if (where.pushTo.indexOf(what) === -1) {
              where.pushTo.push(what);
            }
          } else {
            throw new Error('invalid argument type');
          }
        }
      }
      var n = new obj.Set();
      n.append.apply(n, arguments);
      return n;
    };

    this.receiveFrom = function () {
      for (var k in this.data) {
        var what = this.data[k];
        what.conditional = true;
        for (var i in arguments) {
          var where = arguments[i];
          if (where instanceof obj.Set) {
            where.pushTo(what);
          } else if (where instanceof obj.Rule) {
            if (where.pushTo.indexOf(what) === -1) {
              where.pushTo.push(what);
            }
          } else {
            throw new Error('invalid argument type');
          }
        }
      }
      var n = new obj.Set();
      n.append.apply(n, arguments);
      return n;
    };

    this.addAction = function () {
      for (var i in arguments) {
        var f = arguments[i];
        if (typeof (f) !== 'function') throw new Error('argument must be a function');
        for (var k in this.data) {
          var d = this.data[k];
          d.actions.push(f);
        }
      }
    };

    this.append.apply(this, arguments);
  };

  obj.Builder = function () {
    this.rules = [];
    this.append = function () {
      for (var i in arguments) {
        var arg = arguments[i];
        if (arg instanceof obj.Set) {
          for (var k in arg.data) {
            this.assign(arg.data[k]);
          }
        } else if (arg instanceof obj.Rule) {
          this.assign(arg);
        } else {
          throw new Error('invalid argument type');
        }
      }
    };
    this.assign = function (rule) {
      if (rule.id != null) return rule.id;
      rule.id = this.rules.length;
      this.rules.push(rule);
      for (var i = 0; i < rule.pushTo.length; i++) {
        var pushToRule = rule.pushTo[i];
        if (pushToRule instanceof obj.Rule) {
          rule.pushTo[i] = this.assign(pushToRule); // replace rule with integer
        } else if (typeof (pushToRule) !== 'number') {
          throw new Error('invalid type in rule.pushto');
        }
      }
      return rule.id;
    };

    this.printRules = function () {
      log('Rules (' + this.rules.length + ')');
      for (var i = 0; i < this.rules.length; i++) {
        var rule = this.rules[i];
        var str = '';
        if (rule.conditional) {
          str += 'conditional ';
        }
        if (rule.pushTo.length) {
          str += 'pushesTo: ' + rule.pushTo.toString() + ' ';
        }
        log('Rule ' + i + ': ' + str + ' Checkers (' + rule.checkers.length + '):');
        str = '';
        for (var j in rule.checkers) {
          str += 'Checker ' + j + ': ' + rule.checkers[j].toString();
        }
        log(str);
      }
    };

    this.append.apply(this, arguments);
  };
  return obj;
}());
