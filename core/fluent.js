/**
 * Created by Timo on 26.02.2016.
 */
var completeAssign = require('mini-complete-assign');
var Matcher = require("../core/matcher.js");

'use strict';


var extend = completeAssign;

var fluent = function() {
    var intern =  { };

    var fluentReturn = function(p1,p2){
        var args = Array.prototype.slice.call(arguments);
        if(typeof(p1) == "function") {
            args[1]={props: p2.props};
            p2.props = new Object(); //reset start object
        } else if(typeof(p1) == "object") {
            args[0]={props: p1.props};
            p1.props = new Object(); //reset start object
        } else {
            throw new Error();
        }

        return extend.apply(null,args);
    };

    var packetGetField = function(packet,field) {
        var splits = field.split(".");
        for(var i= 0; i< splits.length; i++) {
            if(typeof(packet) != "undefined")
                packet = packet[splits[i]];
            else
                return undefined;
        }
        return packet;
    };

    var fluentFieldExtend = function(obj,f,subfields) {
        if(!obj.props.field) {
            obj.props.field=f;
        } else {
            obj.props.field = obj.props.field+"."+f;
        }
        if(obj.props.checker) {
            return fluentReturn(function(packet) {
                //console.log("checking if packet ("+packet.id+") has field "+ obj.props.field);
                return packetGetField(packet,obj.props.field)!=null;
            },obj,subfields || {});
        } else {
            return fluentReturn(obj,intern.fluentOperators,subfields || {});
        }

    };

    var fields = {
        "tcp" : ["srcport","dstport"],
        "udp" : ["srcport","dstport"],
        "http" : {
            "header" : ["aaa","bbb"],
            "body" : {}
        }
    };


    var prepareFluentFields = function(obj) {
        var ret = {};
        var bindExtender = function(exp,subs) {
            return function() {return fluentFieldExtend(this,exp,subs); };
        };
        if(obj instanceof Array) {
            for(var i=0; i<obj.length; i++) {
                Object.defineProperty(ret, obj[i], {get: bindExtender(obj[i]), enumerable:true});
            }
        } else if(typeof(obj) == "object") {
            for(var i in obj) {
                var x;
                if(Object.keys(obj[i]).length) {
                    x = bindExtender(i,prepareFluentFields(obj[i]));
                } else {
                    x = bindExtender(i);
                }
                Object.defineProperty(ret, i, { get: x, enumerable: true});
            }
        } else {
            throw new Error();
        }
        return ret;
    };

    intern.fluentFields = prepareFluentFields(fields);

    intern.fluentOperators = {
        "equals" : function(value){
            if(!this.props || ! this.props.field) throw new Error();
            var field = this.props.field;
            var fun = "(function (packet){";
            fun+= "return ";
            fun+= "packet."+this.props.field;
            fun+= "==";
            fun+= JSON.stringify(value);
            fun+=";})";

            return eval(fun);/* function(packet){
                //console.log("checking if packet ("+packet.id+") field "+field+" equals value "+value);
                return intern.packetGetField(packet,field) == value;
            }*/
        }

    };


    intern.fluentFieldors = {
        get field(){
            return fluentReturn(this,intern.fluentFields);
            //return extend({props:this.props}, intern.fluentFields);
        },
        "fieldNamed" : function(fieldname) {
            if (typeof(fieldname)=="string") {
                this.props.field = fieldname;
                if (!this.props.checker) {
                    return fluentReturn(this,intern.fluentOperators);
                } else {
                    var field = this.props.field;
                    return fluentReturn(function (packet) {
                        //console.log("checking if packet ("+packet.id+") has field "+ obj.props.field);
                        return packetGetField(packet, field) != null;
                    },this,intern.fluentOperators);
                }
            }
            throw new Error("Argument of fieldNamed must be a string");
        }
    };

    intern.fluentStartors =
    {
        get has(){
            this.props.checker ="has";
            return fluentReturn(this, intern.fluentFieldors);
        }
    };

    intern.starter = extend({"props" : new Object()},intern.fluentStartors,intern.fluentFieldors);
    return intern;
}();



var fluent2 = function(){
    var intern = { };
    var fluentReturn = function(that){
        var args = Array.prototype.slice.call(arguments);
        args[0]={steps: that.steps};
        that.steps = [{ //reset start object (when aka fluent2) to defaults
            rules: new Matcher.Set(), //without any rules
            actions: [] //without any actions
        }];
        return extend.apply(null,args);
    };

    intern.fluentOperators = {
        get and() {
             var lastStep = this.steps[this.steps.length-1];
             lastStep.optr = "and";
            return fluentReturn(this,intern.fluentActions);
        },
        get or() {
            var lastStep = this.steps[this.steps.length-1];
            lastStep.optr = "or";
            return fluentReturn(this,intern.fluentActions);
        },

    };

    intern.fluentTerminators = {
        "then" : function(f) {
            if(typeof(f)!="function") throw new Error("first parameter must be a function");
            var lastStep = this.steps[this.steps.length-1];
            lastStep.actions.push(f);
            return this;
        },
        "end" : function() {
            for(var i=0; i<this.steps.length; i++) {
                var step = this.steps[i];
                step.rules.addAction.apply(step.rules,step.actions);
                if(i<this.steps.length-1) {
                    step.rules.pushTo(this.steps[i+1].rules);
                }
            }
            return this.steps[0].rules;
        },
        get followedBy() {
            this.steps.push({ //adding an empty step
                rules: new Matcher.Set(), //without any rules
                actions: [] //without any actions
            });
            return fluentReturn(this,intern.fluentActions);
        }
    };
    intern.fluentActions = {
        "matchOn": function(rule) {
            if(typeof(rule) =="function") {
                rule = new Matcher.Rule(rule);
            } else if (!(rule instanceof  Matcher.Rule)) {
                console.log(rule);
                throw new Error("Argument must be a function or an instance of Matcher.Rule");
            }
            var lastStep = this.steps[this.steps.length-1];
            lastStep.rules.append(rule);
            return fluentReturn(this,intern.fluentTerminators,intern.fluentOperators);
        }
    };

    intern.starter = extend({
        "steps" : [{ //adding an empty step
            rules: new Matcher.Set(), //without any rules
            actions: [] //without any actions
        }]
    },intern.fluentActions);

    return intern;
}();


module.exports = {
    "when" : fluent2.starter,
    "packet" : fluent.starter
};