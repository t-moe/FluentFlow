/**
 * Created by timo on 2/26/16.
 */
var PdmlParser = require("./parsers/pdmlParser.js")
var Matcher = require("./core/matcher.js")

var Fluent = require("./core/fluent.js")
var packet = Fluent.packet;
var when = Fluent.when;







var printId = function(pref) {
    return function(p) {
        if(pref) {
            console.log(pref, p.id);
        }else{
            console.log(p.id);
        }
    }
};

/*var rules = {
    0: new Matcher.Rule(packet().field().tcp().dstport().equals(80), printId("rule0")),
    1: new Matcher.Rule(packet().has().field("http"), function(packet,lastpacket){
        console.log("rule2:",packet.id,lastpacket.id);
    })
} ;

rules[1].conditional = true;
rules[0].pushTo = [1];*/

var r1 = new Matcher.Set(new Matcher.Rule(packet().field().tcp().dstport().equals(80), printId("rule0")));
r1.pushTo(new Matcher.Rule(packet().has().field("http"), function(packet,lastpacket){
    console.log("rule2:",packet.id,lastpacket.id);
}));

var rules = new Matcher.Builder(r1).rules;

console.log(rules);


var matcher = new Matcher();
matcher.addRules(rules);
var parser = new PdmlParser();
parser.parseFile("./example.pdml",function(packets) {



    for(var i in packets) {
        var packet = packets[i];
        matcher.matchNext(packet);


      //  if(packet.http) {
        //    console.log(packet.geninfo.num);
        //}

        //console.log(packet.id);
        //when().matchOn("get to host 1 ").and().matchOn("http download from host 1").then(print);
        //when().matchOn("dstport=80").andSameHost.matchOn("download x").andSameHost.
        //when().matchOn("http get from host x").followedBy().matchOn("send data to host x").then(print)
        //when().either().matchOn().followedBy().matchOn().or().matchOn("rerer").then(print)

    }



});



