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
        args[0]={props: p1.props};
        p1.props = {"isLastPacket": p1.props.isLastPacket} //reset start object

        if(typeof(p2) == "function") {
            args[1]=args[0];
            args[0]=p2;
        }

        return extend.apply(null,args);
    };

    var fluentFieldExtend = function(obj,f,subfields) {
        if(!obj.props.field) {
            obj.props.field=f;
        } else {
            obj.props.field = obj.props.field+"."+f;
        }
        return fluentReturn(obj,intern.fluentTermOperators,subfields || {});
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

    var generatePacketFieldExistCheckString = function(packetvarname,field) {
        var splits = field.split(".");
        var str="("+packetvarname+" && ";
        var concat=packetvarname;
        for(var i= 0; i< splits.length-1; i++) {
            concat+="."+splits[i];
            str+=concat + "&& ";
        }
        str += "typeof("+concat+"."+splits[splits.length-1]+") != undefined)";
        return str;
    };

    var appendFunction = function(obj,str) {
        if(!obj.props) throw new Error();
        if(obj.props.funcString) obj.props.funcString += str;
        else obj.props.funcString = str;
    };

    var appendGenerateFunction = function(obj,str) {

        appendFunction(obj,str);
        var fun = "(function (packet){";
        if(obj.props.funcRequiresLastPacket===true) {
            fun = "(function (packet,lastpacket){";
        }
        fun+= "return ";
        fun+= obj.props.funcString;
        fun+=";})";

        return  fluentReturn(obj,eval(fun),intern.fluentOperators);
    };

    intern.fluentFields = prepareFluentFields(fields);

    intern.fluentTermOperators = {
        "equals": function (value) {
            if (!this.props || !this.props.field) throw new Error();
            if(typeof(value)=="object" && typeof(value.props)=="object") { //TODO: improve detection of packet/lastPacket
                //TODO: disallow stuff like 'lastPacket.field("a").and' as value
                var varnameValue = "packet.";
                if(value.props.isLastPacket) {
                    this.props.funcRequiresLastPacket = true;
                    varnameValue = "lastpacket.";
                }
                if(value.props.field) {
                    value = varnameValue+value.props.field;
                } else {
                    value = varnameValue+this.props.field;
                }
            } else {
                value = JSON.stringify(value);
            }

            var varname="packet.";
            if(this.props.isLastPacket) {
                varname = "lastpacket.";
                this.props.funcRequiresLastPacket = true;
            }

            var str = varname+ this.props.field;
            str += "==";
            str += value;

            return appendGenerateFunction(this, str);
        },
        get exists() {
            if (!this.props || !this.props.field) throw new Error();
            var varname="packet";
            if(this.props.isLastPacket) {
                varname = "lastpacket";
                this.props.funcRequiresLastPacket = true;
            }

            return appendGenerateFunction(this, generatePacketFieldExistCheckString(varname, this.props.field));
        }
    };
    intern.fluentOperators = {
        get and() {
            appendFunction(this,"&&");

            var packet = extend({"props":extend({},this.props)},intern.fluentFieldors);
            packet.props.isLastPacket = false;
            var lastPacket = extend({"props":extend({},this.props)},intern.fluentFieldors);
            lastPacket.props.isLastPacket = true;
            return fluentReturn(this,intern.fluentFieldors,intern.fluentTermOperators,{"packet":packet, "lastPacket":lastPacket});
        },
        get or() {
            appendFunction(this,"||");

            var packet = extend({"props":extend({},this.props)},intern.fluentFieldors);
            packet.props.isLastPacket = false;
            var lastPacket = extend({"props":extend({},this.props)},intern.fluentFieldors);
            lastPacket.props.isLastPacket = true;
            return fluentReturn(this,intern.fluentFieldors,intern.fluentTermOperators,{"packet":packet, "lastPacket":lastPacket});
        }

    };


    intern.fluentFieldors = {
        get field(){
            delete this.props.field;
            return fluentReturn(this,intern.fluentFields);
        },
        "fieldNamed" : function(fieldname) {
            if (typeof(fieldname)=="string") {
                this.props.field = fieldname;
                return fluentReturn(this,intern.fluentTermOperators);
            }
            throw new Error("Argument of fieldNamed must be a string");
        }
    };

    intern.currentPacket = extend({"props" : {}},intern.fluentFieldors);
    intern.lastPacket = extend({"props" : {"isLastPacket":true}},intern.fluentFieldors);
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
            throw new Error("not fully implemented");
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
    "packet" : fluent.currentPacket,
    "lastPacket" : fluent.lastPacket
};