/**
 * Created by Timo on 26.02.2016.
 */

var extend = Object.assign;

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
            return extend({props:obj.props}, intern.fluentOperators, subfields)
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
    var intern = {};

    intern.fluentOperators = {
        "and" : function() {


        }


    };

    intern.fluentActions = {
        "then" : function(f) {


        }

    };

    intern.fluentStart = {
        "props" : new Object(),
        "matchOn": function(rule) {
            if(!this.props.rules) {
                this.props.rules=[rule];
            } else {
                this.props.rules.push(rule);
            }

            return extend({props: this.props},intern.fluentActions,intern.fluentOperators);
        }


    };

    return intern.fluentStart;

};

var when = fluent2;
module.exports = {
    "when" : when,
    "packet" : packet
}