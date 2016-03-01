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


module.exports = [

    when.matchOn(packet.field.tcp.dstport.equals(80)).then(printId("rule0"))
        .followedBy.matchOn(packet.has.fieldNamed("http")).then(function(packet,lastpacket){
        console.log("rule1:",packet.id,lastpacket.id);
    }),

    when.matchOn(packet.fieldNamed("tcp.dstport").equals(80))//.then(printId("rule2"))
        .or.matchOn(packet.fieldNamed("tcp.dstport").equals(81)).then(printId("rule3"))
        .followedBy.matchOn(packet.has.fieldNamed("http")).then(function(packet,lastpacket){
        console.log("rule4:",packet.id,lastpacket.id);
    })

];