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

    when.matchOn(packet().field().tcp().dstport().equals(80)).then(printId("rule0"))
        .followedBy.matchOn(packet().has().field("http")).then(function(packet,lastpacket){
        console.log("rule2:",packet.id,lastpacket.id);
    })

];