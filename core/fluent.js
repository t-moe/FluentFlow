/**
 * Created by Timo on 26.02.2016.
 */
var completeAssign = require('mini-complete-assign');
var Matcher = require("../core/matcher.js");

'use strict';


var extend = completeAssign;

var fluentStarters = {
    currentObject: {},
    lastObject: {}
};

/**
 * Creates a new Fluent API for objects (fieldNamed(bla).exists.and.equals(foo).or....)
 * @param fields The fields which should be made available on field.* (as alternative to fieldNamed(*) )
 * @param starters The start objects which should be made available. Per default we use "currentObject" and "lastObject" but you can create aliases for them.
 * @returns An object which contains the start objects ("currentObject", "lastObject" and all the aliases you defined).
 */
var fluent = function(fields,starters) {
    var intern =  { };
    intern.starters = extend({},fluentStarters,starters || {}); //extend the custom starter (aliases) with our default ones

    var defaultFields = { //The fields which are available on the the field.* api.

        /* Here's how the field parameter or the defaultFields should be structured:

         "tcp" : ["srcport","dstport"], //defines tcp.srcport and tcp.dstport
         "udp" : ["srcport","dstport"], //udp.srcport and udp.dstport
         "ip" : ["src","dst"], //ip.dst and ip.src
         "http" : { //defines http.header.aaa, http.header.bbb and http.body
         "header" : ["aaa","bbb"],
         "body" : {}

         }
         */
    };
    var fields =extend({},defaultFields,fields || {});

    var fluentReturn = function(p1,p2){
        var args = Array.prototype.slice.call(arguments);
        args[0]={props: p1.props};
        p1.props = {"isLastObject": p1.props.isLastObject} //reset start object

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
        var x = {
            "toString" : function() {
                return this.props.field;
            }
        }
        return fluentReturn(obj,intern.fluentTermOperators,subfields || {},x);
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

    var generateFieldExistCheckString = function(varname,field) {
        var splits = field.split(".");
        var str="("+varname+" && ";
        var concat=varname;
        for(var i= 0; i< splits.length-1; i++) {
            concat+="."+splits[i];
            str+=concat + "&& ";
        }
        str += "typeof("+concat+"."+splits[splits.length-1]+") != \"undefined\")";
        return str;
    };

    var appendFunction = function(obj,str) {
        if(!obj.props) throw new Error();
        if(obj.props.funcString) obj.props.funcString += str;
        else obj.props.funcString = str;
    };

    var appendGenerateFunction = function(obj,str) {

        appendFunction(obj,str);
        var fun = "(function (object){";
        if(obj.props.funcRequiresLastObject===true) {
            fun = "(function (object,lastobject){";
        }
        fun+= "return ";
        fun+= obj.props.funcString;
        fun+=";})";

        var x = {
            "toString" : function() {
                return this.props.funcString;
            }
        };

        return  fluentReturn(obj,eval(fun),intern.fluentOperators,x);
    };

    var serializeValue = function(value) {
        if(typeof(value)=="object" && typeof(value.props)=="object") { //TODO: improve detection of object/lastObject
            //TODO: disallow stuff like 'lastObject.field("a").and' as value
            var varnameValue = "object.";
            if(value.props.isLastObject) {
                this.props.funcRequiresLastObject = true;
                varnameValue = "lastobject.";
            }
            if(value.props.field) {
                value = varnameValue+value.props.field;
            } else {
                value = varnameValue+this.props.field;
            }
        } else {
            value = JSON.stringify(value);
        }
        return value;
    };

    var serializeVarname = function() {
        if (!this.props || !this.props.field) throw new Error();

        var varname="object.";
        if(this.props.isLastObject) {
            varname = "lastobject.";
            this.props.funcRequiresLastObject = true;
        }
        return varname+this.props.field;
    };

    var newFluentStarters = function(props) {
        var res = {};
        for(var k in intern.starters) {
            var obj = intern.starters[k];
            var newObj = extend({"props":extend({},props)},intern.fluentFieldors);;
            if(obj == fluentStarters.currentObject) {
                newObj["props"].isLastObject = false;
            } else if(obj==fluentStarters.lastObject) {
                newObj["props"].isLastObject = true;
            } else {
                throw new Error("not supported value");
            }
            res[k] = newObj;
        }

        return res;
    };

    intern.fluentFields = prepareFluentFields(fields);

    intern.fluentTermOperators = {
        "equals": function (value) {
            var str = serializeVarname.call(this);
            if(typeof (value) == "number") {
                str = "parseInt("+str+")";
            }
            str += "==";
            str += serializeValue.call(this,value);

            return appendGenerateFunction(this, "("+str+")");
        },
        "between" : function(lower,upper) {
            var varname = serializeVarname.call(this);
            if(typeof(lower)!="number") lower = "parseInt("+serializeValue.call(this,lower)+")";
            if(typeof(upper)!="number") upper = "parseInt("+serializeValue.call(this,upper)+")";
            var str = "(parseInt("+varname+")>"+lower+"&&parseInt("+varname+")<"+upper+")";
            return appendGenerateFunction(this,str);
        },
        "contains" : function(value) {
            value = serializeValue.call(this,value);
            var str = "("+ serializeVarname.call(this)+".indexOf("+value+")>=0)";

            return appendGenerateFunction(this,str);
        },
        "matches" : function(expr) {
            if(!(expr instanceof  RegExp)) throw new Error ("argument is not a regular expression");
            var str = "("+expr.toString()+".test("+serializeVarname.call(this)+"))";

            return appendGenerateFunction(this,str);
        },
        get not() {
            appendFunction(this,"!");
            return  fluentReturn(this,intern.fluentTermOperators);
        },
        get exists() {
            if (!this.props || !this.props.field) throw new Error();
            var varname="object";
            if(this.props.isLastObject) {
                varname = "lastobject";
                this.props.funcRequiresLastObject = true;
            }

            return appendGenerateFunction(this, generateFieldExistCheckString(varname, this.props.field));
        }
    };
    intern.fluentOperators = {
        get and() {
            appendFunction(this,"&&");
            var res = newFluentStarters(this.props);
            return fluentReturn(this,intern.fluentFieldors,intern.fluentTermOperators,res);
        },
        get or() {
            appendFunction(this,"||");
            var res = newFluentStarters(this.props);
            return fluentReturn(this,intern.fluentFieldors,intern.fluentTermOperators,res);
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

    return extend(intern,newFluentStarters({}));
};



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
};


module.exports = {
    "Object" : extend(fluent,fluentStarters),
    "Matcher" : fluent2
};