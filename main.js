/**
 * Created by timo on 2/26/16.
 */
var pdml = require("./pdmlParser.js")
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

    intern.fluentOperators = {
        "equals" : function(value){
            if(!this.props || ! this.props.field) throw new Error();
            var field = this.props.field;
            return function(packet){
                console.log("checking if packet field "+field+" equals value "+value ,packet);
                return packet[field] === value;
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
                console.log("checking if packet has field "+ obj.props.field,packet);
                return packet[obj.props.field]!=null;
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
                }
                return this;
            }
            return extend({props:this.props}, intern.fluentFields);
        }


    };


    return intern.fluentStart;
};

var packet = fluent;


console.log(packet().field("tcp.aaa"));
console.log(packet().field());
console.log(packet().field().tcp());
console.log(packet().field().tcp().srcport());
console.log(packet().field().tcp().srcport().equals(80)({}));
console.log(packet().has());
console.log(packet().has().field());
console.log(packet().has().field().tcp());
console.log(packet().has().field().tcp().dstport()({}));


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


var parser = new pdml();
parser.parseFile("./example.pdml",function(packets) {

    //console.log(packets);

    for(var i in packets) {
        var packet = packets[i];
        if(packet.http) {
            console.log(packet.geninfo.num);
        }

        //when().matchOn("get to host 1 ").and().matchOn("http download from host 1").then(print);
        //when().matchOn("http get from host x").followedBy().matchOn("send data to host x").then(print)
        //when().either().matchOn().followedBy().matchOn().or().matchOn("rerer").then(print)

    }



});



