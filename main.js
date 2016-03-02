/**
 * Created by timo on 2/26/16.
 */
var PdmlParser = require("./parsers/pdmlParser.js")
var Matcher = require("./core/matcher.js")

/*var Fluent = require("./core/fluent.js")
var packet = Fluent.packet;
var when = Fluent.when;*/




var r = require("./rules.js");
var builder = new Matcher.Builder();
for(var i in r) {
    builder.append(r[i].end());
}

builder.printRules();

var matcher = new Matcher();
matcher.addRules(builder.rules);


var parser = new PdmlParser();
//parser.parseFile("./example.pdml",function(packet) {
parser.parseStdin(function(packet) {


    matcher.matchNext(packet);


    //  if(packet.http) {
    //    console.log(packet.geninfo.num);
    //}

    //console.log(packet.id);
    //when().matchOn("get to host 1 ").and().matchOn("http download from host 1").then(print);
    //when().matchOn("dstport=80").andSameHost.matchOn("download x").andSameHost.
    //when().matchOn("http get from host x").followedBy().matchOn("send data to host x").then(print)
    //when().either().matchOn().followedBy().matchOn().or().matchOn("rerer").then(print)


});



