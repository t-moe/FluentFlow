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
               this.rules = [];
           }
           Object.assign(this.rules,rules);
       };

       this.clearRules = function() {
         this.rules = [];
       };

       this.matchNext = function (packet) {
           var pushTo = new Object();
           var unpushTo = new Object();

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

           var unpushPacketTo = function (from, to) {
               if (unpushTo[to]) {
                   unpushTo[to][from] = true;
               } else {
                   unpushTo[to] = {from: true};
               }
           };

           for (var ruleId in this.rules) {
               var ruleDef = this.rules[ruleId];
               if (!ruleDef.conditional || ruleDef.params.length > 0) {
                   if (ruleDef.rule == null || ruleDef.rule.length == 1 || ruleDef.params.length == 0) { //rule checker doesn't care about the previous matches in chain (= it has only one param)
                       if (ruleDef.rule == null || ruleDef.rule(packet)) { //rule matches or no matcher set
                           if (ruleDef.params.length == 0) {
                               if (ruleDef.action) {
                                   ruleDef.action(packet);
                               }
                               if (ruleDef.pushTo.length > 0) {
                                   for (var k in ruleDef.pushTo) {
                                       var toWhere = ruleDef.pushTo[k];
                                       pushPacketTo(ruleId, toWhere, [packet]);
                                   }
                               }
                               if (ruleDef.unpushFromTo.length > 0) {
                                   for (var k in ruleDef.unpushFromTo) {
                                       var entry = ruleDef.unpushFromTo[k];
                                       unpushPacketTo(entry.from, entry.to);
                                   }
                               }
                           } else {
                               while (ruleDef.params.length > 0) {
                                   var param = ruleDef.params.shift();
                                   param.unshift(packet); //add front
                                   if (ruleDef.action) {
                                       ruleDef.action.apply(this,param);
                                   }

                                   if (ruleDef.pushTo.length > 0) {

                                       for (var k in ruleDef.pushTo) {
                                           var toWhere = ruleDef.pushTo[k];
                                           pushPacketTo(ruleId, toWhere, param);
                                       }
                                   }
                                   if (ruleDef.unpushFromTo.length > 0) {
                                       for (var k in ruleDef.unpushFromTo) {
                                           var entry = ruleDef.unpushFromTo[k];
                                           unpushPacketTo(entry.from, entry.to);
                                       }
                                   }
                               }
                           }
                       }
                   } else { //rule checker care's about previous packets
                        throw new Error(); //TODO: implement!!
                   }
               }
           }

           for (var toWhere in pushTo) {
               var pushFrom = pushTo[toWhere];
               var unpushFrom = unpushTo[toWhere];
               for (var fromWhere in pushFrom) {
                   if (unpushFrom && unpushFrom[fromWhere] === true) continue;
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
        this.conditional = false; //if set to true the rule will only be executed if there are params available
        this.params = new Array(); //params objects (one entry = array of matches along the chain), those params shall be passed down the chain and to the action handlers
        this.rule = rule?rule:null; //rule check function. First parameter: Current Packet, Second Parameter: array of the previous packets down the chain
        this.action=action?action:null; //action handler function which will be called on match. First parameter: Current Packet, Second Parameter: array of the previous packets down the chain
        this.pushTo = new Array(); //ruleid of rules to which params to push matches to. An entry "3" will push the all matches to the params of rule 3.
        this.unpushFromTo = new Object(); //pushes to undo. an entry must be an object with the properties from, to (both id's).
    };
    return obj;
}();
