var Fluent = require("./core/fluent.js")
var packet = Fluent.packet;
var lastPacket = Fluent.lastPacket;
var when = Fluent.when;


var printId = function(pref) {
    return function() {
        var args = Array.prototype.slice.call(arguments);
        for (var i = 0; i < args.length; i++) {
            args[i] = args[i].id;
        }
        if (pref) {
            args.unshift(pref);
        }
        console.log.apply(null,args);
    }
};


module.exports = [

    //----- Rule 1: A matcher function on a single packet ---------------------
    when.matchOn(function(packet) {
        //Do some checks here on packet struct
        return false; //return true on match
    }).then(printId("My 1st Rule matched on packet with id:")),

    //----- Rule 2: A matcher function matching on a single packet followed by another packet which has to match something else
    when.matchOn(function(packet) {
        //Do some checks here on packet struct
        return packet.tcp.dstport==80; //return true on match
    }).followedBy.matchOn(function(packet,lastpacket){
        //Do some checks here on packet OR lastpacket struct
        return packet.http && packet.ip.src==lastpacket.ip.dst; //return true on match
    }).then(printId("My 2nd Rule matched on packet-chain with ids:")),


    //----- Rule 3: Using fluent API to describe packet matching function
    when.matchOn(packet.field.tcp.dstport.equals(80)).then(printId("rule3a"))
        .followedBy.matchOn(packet.fieldNamed("http").exists).then(printId("rule3b")),

    //----- Rule 4: Use two alternative matcher functions where at least one must match before a third matcher function is executed
    when.matchOn(packet.fieldNamed("tcp.dstport").equals(80))
        .or.matchOn(packet.fieldNamed("tcp.dstport").equals(443)).then(printId("rule4a"))
        .followedBy.matchOn(packet.fieldNamed("http").exists).then(printId("rule4b")),

    //----- Rule 5: Matches a http packet followed by any packet from the same src ip
    when.matchOn(packet.fieldNamed("http").exists).followedBy.matchOn(packet.fieldNamed("ip.src").equals(lastPacket)).then(printId("rule5")),

    //----- Rule 6: Matches a http packet followed by a udp packet from the same src ip
    when.matchOn(packet.fieldNamed("http").exists).followedBy.matchOn(packet.fieldNamed("udp.src").exists.and.equals(lastPacket.fieldNamed("tcp.src"))).then(printId("rule6"))


];