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


var Rule = function(rule,action) {
    this.conditional = false;
    this.params = new Array();
    this.rule = rule?rule:null;
    this.action=action?action:null;
    this.pushTo = new Array();
}


var printId = function(pref) {
    return function(p) {
        if(pref) {
            console.log(pref, p.id);
        }else{
            console.log(p.id);
        }
    }
};

var rules = {
    0: new Rule(packet().has().field("http"), printId("rule0")),
    1: new Rule(packet().field().tcp().srcport().equals(80), function(packet,packets){
        console.log("rule2:",packet.id,packets[0].id);
    })
} ;

rules[1].conditional = true;
rules[0].pushTo = [1];




var parser = new pdml();
parser.parseFile("./example.pdml",function(packets) {



    for(var i in packets) {
        var pushTo = new Array();

        var packet = packets[i];
        for(var j in rules) {
            var ruleDef = rules[j];
            if(!ruleDef.conditional || ruleDef.params.length>0) {
                if(ruleDef.rule == null ||ruleDef.rule.length == 1 || ruleDef.params.length==0) { //rule checker doesn't care about the previous matches in chain (= it has only one param)
                    if (ruleDef.rule == null || ruleDef.rule(packet)) { //rule matches or no matcher set
                        if (ruleDef.params.length == 0) {
                            if (ruleDef.action) {
                                ruleDef.action(packet, new Array());
                            }
                            if(ruleDef.pushTo.length>0) {
                                for(var k in ruleDef.pushTo) {
                                    var p2 = ruleDef.pushTo[k];
                                    if(pushTo[p2]) {
                                        pushTo[p2].push([packet]);
                                    } else {
                                        pushTo[p2] = [[packet]];
                                    }


                                }
                            }
                        } else {
                            while (ruleDef.params.length > 0) {
                                var param = ruleDef.params.shift();
                                if (ruleDef.action) {
                                    ruleDef.action(packet, param);
                                }
                                param.push(packet);
                                if(ruleDef.pushTo.length>0) {
                                     for(var k in ruleDef.pushTo) {
                                         var p2 = ruleDef.pushTo[k];
                                         if(pushTo[p2]) {
                                             pushTo[p2].push(param);
                                         } else {
                                             pushTo[p2] = [param];
                                         }
                                     }
                                 }
                            }
                        }
                    }
                } else { //rule checker care's about previous packets

                }
            }
        }

        for(var i in pushTo) {
            var arr = pushTo[i];
            for(var k in arr) {
                rules[i].params.push(arr[k]);
            }
        }








      //  if(packet.http) {
        //    console.log(packet.geninfo.num);
        //}

        //console.log(packet.id);
        //when().matchOn("get to host 1 ").and().matchOn("http download from host 1").then(print);
        //when().matchOn("http get from host x").followedBy().matchOn("send data to host x").then(print)
        //when().either().matchOn().followedBy().matchOn().or().matchOn("rerer").then(print)






    }



});



