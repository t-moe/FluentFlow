/**
 * Created by Timo on 26.02.2016.
 */

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

       this.matchNext = function (packet) {
           log("new packet",packet);

           var pushTo = new Object();
           //var unpushTo = new Object();

           var pushPacketTo = function (from, to, params) {
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

           /*var unpushPacketTo = function (from, to) {
               if (unpushTo[to]) {
                   unpushTo[to][from] = true;
               } else {
                   unpushTo[to] = {from: true};
               }
           };*/

           var afterMatch = function(ruleDef, params) {
               var ruleId = ruleDef.id;
               if (ruleDef.action) {
                   ruleDef.action.apply(this,params.slice());
               }
               if (ruleDef.pushTo.length > 0) {
                   for (var k in ruleDef.pushTo) {
                       var toWhere = ruleDef.pushTo[k];
                       pushPacketTo(ruleId, toWhere, params.slice());
                   }
               }
               /*if (ruleDef.unpushFromTo.length > 0) {
                   for (var k in ruleDef.unpushFromTo) {
                       var entry = ruleDef.unpushFromTo[k];
                       unpushPacketTo(entry.from, entry.to);
                   }
               }*/
           };

           for (var ruleId in this.rules) {
               var ruleDef = this.rules[ruleId];
               if (!ruleDef.conditional || ruleDef.params.length > 0) { //Rule must be processed
                   if (ruleDef.rule == null || ruleDef.rule.length == 1 || ruleDef.params.length == 0) { //rule checker doesn't care about the previous matches in chain (e.g. because it takes only one parameter)
                       if (ruleDef.rule == null || ruleDef.rule(packet)) { //rule matches or no matcher set
                           log("match on rule "+ruleId);
                           if (ruleDef.params.length == 0) { //No "Arguments" available. Call action only once
                               afterMatch(ruleDef,[packet]); //Call action, apply pushTo and unpushTo
                           } else { //Arguments available. Call action once per argument
                               while (ruleDef.params.length > 0) {
                                   var param = ruleDef.params.shift(); //remove first argument and process it
                                   param.unshift(packet); //add packet front
                                   afterMatch(ruleDef,param); //Call action, apply pushTo and unpushTo
                               }
                           }
                       }
                   } else { //rule checker care's about previous packets
                       for(var i=0; i < ruleDef.params.length; i++) {
                           var param = ruleDef.params[i].slice(); //copy param!
                           param.unshift(packet); //add packet front
                           if(ruleDef.rule.apply(this,param)) { //rule matches
                               log("match on rule "+ruleId+" with param", param);
                               ruleDef.params.splice(i--,1); //remove argument from ruleDef because it matched
                               afterMatch(ruleDef,param); //Call action, apply pushTo and unpushTo
                           }
                       }
                   }
               }
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
        this.rule = rule?rule:null; //rule check function. First parameter: Current Packet, Second Parameter: array of the previous packets down the chain
        this.action=action?action:null; //action handler function which will be called on match. First parameter: Current Packet, Second Parameter: array of the previous packets down the chain
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

        this.setAction = function(f) {
            if(typeof(f)!=="function") throw new Error("argument must be a function");
            for(var k in this.data) {
                var d = this.data[k];
                if(d.action) throw new Error("Action already set");
                d.action = f;
            }
        }

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
            if(rule.id!=null) return;
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

        this.append.apply(this,arguments);

    };
    return obj;
}();
