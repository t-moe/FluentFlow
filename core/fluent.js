/**
 * Created by Timo on 26.02.2016.
 */
var completeAssign = require('mini-complete-assign');
var Matcher = require("../core/matcher.js");

'use strict';


var extend = completeAssign;

var fluent = function() {
    var intern = {};


    intern.fluentFields = {
        "tcp" : function()  {
            return intern.fluentFieldExtend(this,"tcp",{
                "srcport" : function(){return intern.fluentFieldExtend(this,"srcport");},
                "dstport" : function(){return intern.fluentFieldExtend(this,"dstport");}
            });
        },
        "udp" : function() {
            return intern.fluentFieldExtend(this, "udp");
        }

    };

    intern.packetGetField = function(packet,field) {
        var splits = field.split(".");
        for(var i= 0; i< splits.length; i++) {
            if(typeof(packet) != "undefined")
                packet = packet[splits[i]];
            else
                return undefined;
        }
        return packet;
    }

    intern.fluentOperators = {
        "equals" : function(value){
            if(!this.props || ! this.props.field) throw new Error();
            var field = this.props.field;
            return function(packet){
                //console.log("checking if packet ("+packet.id+") field "+field+" equals value "+value);
                return intern.packetGetField(packet,field) == value;
            }
        }

    };

    intern.fluentFieldExtend = function(obj,f,subfields) {
        if(!obj.props.field) {
            obj.props.field=f;
        } else {
            obj.props.field = obj.props.field+"."+f;
        }
        if(obj.props.checker) {
            return extend(function(packet) {
                //console.log("checking if packet ("+packet.id+") has field "+ obj.props.field);
                return intern.packetGetField(packet,obj.props.field)!=null;
            },{props:obj.props},subfields);
        } else {
            return extend({props:obj.props}, intern.fluentOperators, subfields || {})
        }

    };


    intern.fluentStart =
    {
        "props" : new Object(),

        "has" : function(){
            return {
                props: {checker: "has"},
                field: intern.fluentStart.field
            };
        },
        "field" : function(fieldname) {
            if(fieldname) {
                this.props.field = fieldname;
                if(!this.props.checker) {
                    return extend({props:this.props}, intern.fluentOperators);
                } else {
                    var field = this.props.field;
                    return extend(function(packet) {
                        //console.log("checking if packet ("+packet.id+") has field "+ obj.props.field);
                        return intern.packetGetField(packet,field)!=null;
                    },{props:this.props}, intern.fluentOperators);
                }
            }
            return extend({props:this.props}, intern.fluentFields);
        }


    };


    return intern.fluentStart;
};

var packet = fluent;

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
                throw new Error("Argument must be a function or an instance of Matcher.Rule");
            }
            var lastStep = this.steps[this.steps.length-1];
            lastStep.rules.append(rule);
            return fluentReturn(this,intern.fluentTerminators,intern.fluentOperators);
        }
    };


    return  extend({
        "steps" : [{ //adding an empty step
            rules: new Matcher.Set(), //without any rules
            actions: [] //without any actions
        }]
    },intern.fluentActions);


}();

var when = fluent2;
module.exports = {
    "when" : when,
    "packet" : packet
}