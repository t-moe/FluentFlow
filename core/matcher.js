/**
 * Created by Timo on 26.02.2016.
 */

var deasync = require("deasync");

module.exports =  function() {
    var obj = function() {

        var log = function() {
            // Comment/uncomment for debug output
            // console.log.apply(this,arguments);
        };

        this.addRules = function (rules) {
            if (!(this.rules)) {
                this.rules = {};
            }
            Object.assign(this.rules,rules);
            for(var i in this.rules) {
                this.rules[i].id = i;
            }
        };

        this.clearRules = function() {
            this.rules = [];
        };

        this.matchNext = function (object) {
            log("new object",object);

            var pushTo = new Object();
            var finishedTasks = new Array();
            //var unpushTo = new Object();

            var pushObjectTo = function (from, to, params) {
                log("request push from "+ from +" to "+to +" params ",params);
                if (pushTo[to]) {
                    if (pushTo[to][from]) {
                        pushTo[to][from].push(params);
                    } else {
                        pushTo[to][from] = [params];
                    }
                } else {
                    pushTo[to] ={};
                    pushTo[to][from]= [params];
                }
            };

            /*var unpushObjectTo = function (from, to) {
              if (unpushTo[to]) {
              unpushTo[to][from] = true;
              } else {
              unpushTo[to] = {from: true};
              }
              };*/

            var afterMatch = function(ruleDef, params) {
                var ruleId = ruleDef.id;
                var copy = params.slice(); //make one copy for all action handlers
                for(var i in ruleDef.actions) { //foreach action handler
                    ruleDef.actions[i].apply(this,copy);
                }
                if (ruleDef.pushTo.length > 0) {
                    for (var k in ruleDef.pushTo) {
                        var toWhere = ruleDef.pushTo[k];
                        pushObjectTo(ruleId, toWhere, params.slice()); //make one copy per ruleDef
                    }
                }
                /*if (ruleDef.unpushFromTo.length > 0) {
                  for (var k in ruleDef.unpushFromTo) {
                  var entry = ruleDef.unpushFromTo[k];
                  unpushObjectTo(entry.from, entry.to);
                  }
                  }*/
            };

            var checkRule = function(ruleDef,param,ind,param2remove) {
                var ruleId = ruleDef.id;
                var checkerInd=ind || 0;
                var hasParam=(param!=undefined);
                var asyncMode =false;
                var asyncInd = 0;

                var validateCheck = function(checker,retVal) {
                    if(typeof(retVal)=="boolean") {
                        context.next(retVal);
                    } else if(typeof(retVal)=="undefined") {
                        if(!asyncMode) {
                            asyncMode = true;
                            asyncInd = finishedTasks.length;
                            finishedTasks.push(false);
                        }
                    } else {
                        log(checker.toString());
                        throw new Error("Invalid return value of matcher function. must be boolean or undefined (async).");
                    }
                };

                var endCheck = function() {
                    if(hasParam) {
                        log("match on rule "+ruleId+" with param", param);
                        ruleDef.params.splice(ruleDef.params.indexOf(param2remove),1); //remove argument from ruleDef because it matched
                        afterMatch(ruleDef,param); //Call action, apply pushTo and unpushTo
                    } else {
                        log("match on rule "+ruleId);
                        if (ruleDef.params.length == 0) { //No "Arguments" available. Call action only once
                            afterMatch(ruleDef, [object]);
                        } else { //Arguments available. Call action once per argument
                            while (ruleDef.params.length > 0) {
                                var par = ruleDef.params.shift(); //remove first argument and process it
                                par.unshift(object); //add object front
                                afterMatch(ruleDef, par);
                            }
                        }
                    }
                    if(asyncMode) {
                        finishedTasks[asyncInd] =true; //mark rule check task as finished
                    }
                };

                var continueCheck = function() {
                    if(checkerInd == ruleDef.checkers.length) { //was last
                        endCheck();
                        return;
                    }
                    var checker = ruleDef.checkers[checkerInd++];
                    hasParam = hasParam || (checker.length > 1 && ruleDef.params.length > 0); //if the checker takes more than one argument, and we have more than one object to pass
                    if(!hasParam) {
                        validateCheck(checker,checker.call(context,object));
                    } else if(param==undefined) {
                        var params =  ruleDef.params.slice(); //shadow copy, so that array will not shrink
                        for (var paramInd = 0; paramInd < params.length; paramInd++) { //foreach param
                            var par = params[paramInd].slice(); //copy param!
                            par.unshift(object); //add object front
                            log("try to match rule "+ruleId+" with args",par);
                            checkRule(ruleDef, par, checkerInd - 1,params[paramInd]);
                        }
                    } else {
                        validateCheck(checker,checker.apply(context,param));
                    }
                };

                var context =  {
                    "next": function(matched) {
                        if(matched===true) {
                            continueCheck();
                        } else if(matched===false) {
                            if(asyncMode) {
                                finishedTasks[asyncInd] =true; //mark rule check task as finished
                            }
                        } else {
                            log(ruleDef.checkers[checkerInd-1].toString());
                            throw new Error("Invalid argument to next function. must be boolean");
                        }
                    }
                };

                continueCheck();


/*

                for(var checkerInd=0; checkerInd<ruleDef.checkers.length; checkerInd++) { //foreach checker function
                    var isLast = (checkerInd == ruleDef.checkers.length-1); //whether this is the last checker function
                    var checker = ruleDef.checkers[checkerInd];
                    var caresAboutPrev = (checker.length > 1 && ruleDef.params.length > 0); //if the checker takes more than one argument, and we have more than one object to pass
                    if(!caresAboutPrev) { //we only have the current object to pass (no previous in chain) or the checker takes only one argument
                        if(!checker(object)) { //checker didn't match
                            break; //abort here: the remaining checkers will be ignored
                        } else if(isLast) { //if it matched and this was the last checker: MATCH!
                            log("match on rule "+ruleId);
                            if (ruleDef.params.length == 0) { //No "Arguments" available. Call action only once
                                afterMatch(ruleDef,[object]); //Call action, apply pushTo and unpushTo
                            } else { //Arguments available. Call action once per argument
                                while (ruleDef.params.length > 0) {
                                    var param = ruleDef.params.shift(); //remove first argument and process it
                                    param.unshift(object); //add object front
                                    afterMatch(ruleDef,param); //Call action, apply pushTo and unpushTo
                                }
                            }
                        }
                    } else { //checker cares about previous rules
                        for(var paramInd=0; paramInd < ruleDef.params.length; paramInd++) { //foreach param
                            var param = ruleDef.params[paramInd].slice(); //copy param!
                            param.unshift(object); //add object front
                            log("try to match rule "+ruleId+" with args",param);

                            for(var checkerInd2=checkerInd; checkerInd2<ruleDef.checkers.length; checkerInd2++) { //foreach remaining checker function
                                isLast = (checkerInd2 == ruleDef.checkers.length-1); //whether this is the last checker function
                                checker = ruleDef.checkers[checkerInd2];
                                if(!checker.apply(this,param)) { //checker didn't match
                                    break; //abort here: the remaining checkers will be ignored, next params will be tried
                                } else if(isLast) { //if it matched and this was the last checker: MATCH!
                                    log("match on rule "+ruleId+" with param", param);
                                    ruleDef.params.splice(paramInd--,1); //remove argument from ruleDef because it matched
                                    afterMatch(ruleDef,param); //Call action, apply pushTo and unpushTo
                                }
                            }
                        }
                        break; //don't continue the initial for loop
                    }
                };*/

            }

            for (var ruleId in this.rules) { //foreach rule
                var ruleDef = this.rules[ruleId];
                if (!ruleDef.conditional || ruleDef.params.length > 0) { //Rule must be processed
                    checkRule(ruleDef); //check one rule (async)
                }
            }

            if(finishedTasks.length) {
                deasync.loopWhile(function () {
                    for(var i=0; i<finishedTasks.length; i++) {
                        if(finishedTasks[i] === false) return true; //continue deasync's loop while as long as one task is not finished
                    }
                    return false; //all tasks finished. quit loop.
                });
            }

            for (var toWhere in pushTo) {
                var pushFrom = pushTo[toWhere];
                // var unpushFrom = unpushTo[toWhere];
                for (var fromWhere in pushFrom) {
                    //if (unpushFrom && unpushFrom[fromWhere] === true) continue;
                    var params = pushFrom[fromWhere];
                    log("before pushing from "+fromWhere+" to "+toWhere,params);
                    for (var ind in params)
                        this.rules[toWhere].params.push(params[ind]);
                    log("after pushing from "+fromWhere+" to "+toWhere,params);
                }
            }
        };

    };

    obj.Rule = function(rule,action) {
        this.id = null; //The id of the rule (will be autofilled after calling addRules())
        this.conditional = false; //if set to true the rule will only be executed if there are params available
        this.params = new Array(); //params objects (one entry = array of matches along the chain), those params shall be passed down the chain and to the action handlers
        this.checkers = rule?[rule]:[]; //rule check functions. First parameter: Current Object, Second Parameter: array of the previous objects down the chain
        this.actions=action?[action]:[]; //action handler functions which will be called on match. First parameter: Current Object, Second Parameter: array of the previous objects down the chain
        this.pushTo = new Array(); //ruleid of rules to which params to push matches to. An entry "3" will push the all matches to the params of rule 3.
        //this.unpushFromTo = new Object(); //pushes to undo. an entry must be an object with the properties from, to (both id's).
    };

    obj.Set = function() {
        this.data = [];
        this.append = function () {
            for (var i in arguments) {
                var arg = arguments[i];
                if(arg instanceof obj.Set) {
                    for(var k in arg.data) {
                        this.data.push(arg.data[k]);
                    }
                } else if(arg instanceof obj.Rule) {
                    this.data.push(arg);
                } else {
                    throw new Error("invalid argument type");
                }
            }
        };
        this.at = function(i) {
            return this.data[i];
        };
        this.removeAt = function(i) {
            return this.data.splice(i,1);
        };
        this.size = function() {
            return this.data.length;
        };

        this.pushTo = function(s) {
            for(var k in this.data) {
                var where = this.data[k];
                for (var i in arguments) {
                    var what = arguments[i];
                    if(what instanceof obj.Set) {
                        what.receiveFrom(where);
                    } else if (what instanceof obj.Rule){
                        what.conditional = true;
                        if (where.pushTo.indexOf(what) == -1) {
                            where.pushTo.push(what);
                        }
                    } else {
                        throw new Error("invalid argument type");
                    }
                }
            }
            var n = new obj.Set();
            n.append.apply(n,arguments);
            return n;
        };

        this.receiveFrom = function(){
            for(var k in this.data) {
                var what = this.data[k];
                what.conditional = true;
                for (var i in arguments) {
                    var where = arguments[i];
                    if(where instanceof obj.Set) {
                        where.pushTo(what);
                    } else if(where instanceof obj.Rule) {
                        if (where.pushTo.indexOf(what) == -1) {
                            where.pushTo.push(what);
                        }
                    } else {
                        throw new Error("invalid argument type");
                    }
                }
            }
            var n = new obj.Set();
            n.append.apply(n,arguments);
            return n;
        };

        this.addAction = function() {
            for(var i in arguments) {
                var f = arguments[i];
                if (typeof(f) !== "function") throw new Error("argument must be a function");
                for (var k in this.data) {
                    var d = this.data[k];
                    d.actions.push(f);
                }
            }
        };

        this.append.apply(this,arguments);

    };

    obj.Builder = function() {
        this.rules = [];
        this.append = function() {
            for (var i in arguments) {
                var arg = arguments[i];
                if(arg instanceof obj.Set) {
                    for(var k in arg.data) {
                        this.assign(arg.data[k]);
                    }
                } else if(arg instanceof obj.Rule) {
                    this.assign(arg);
                } else {
                    throw new Error("invalid argument type");
                }
            }
        };
        this.assign = function(rule) {
            if(rule.id!=null) return rule.id;
            rule.id=this.rules.length;
            this.rules.push(rule);
            for(var i=0; i<rule.pushTo.length; i++) {
                var pushToRule = rule.pushTo[i];
                if(pushToRule instanceof obj.Rule) {
                    rule.pushTo[i] =this.assign(pushToRule); //replace rule with integer
                } else if(typeof(pushToRule)!=="number") {
                    throw new Error("invalid type in rule.pushto");
                }
            }
            return rule.id;
        };

        this.printRules = function() {
            console.log("Rules ("+this.rules.length+")");
            for(var i =0; i<this.rules.length;i++) {
                var rule = this.rules[i];
                var str="";
                if(rule.conditional) {
                    str+="conditional ";
                }
                if(rule.pushTo.length) {
                    str+="pushesTo: "+rule.pushTo.toString()+" ";
                }
                console.log("Rule "+i+": "+str+" Checkers ("+rule.checkers.length+"):");
                str="";
                for(var j in rule.checkers) {
                    str+="Checker "+j+": " + rule.checkers[j].toString()
                }
                console.log(str);
            }
        };

        this.append.apply(this,arguments);

    };
    return obj;
}();
