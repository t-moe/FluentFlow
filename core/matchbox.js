const Fluent = require('./fluent.js');
const Matcher = require('./matcher.js');

'use strict';

const fields = { //fields which will be made available on packet.field.* or lastPacket.field.*
    "tcp" : ["srcport","dstport"],
    "udp" : ["srcport","dstport"],
    "ip" : ["src","dst"],
    "http" : {}
};

const starters = {
    "packet": Fluent.Object.currentObject, //make packet.* an alias for currentObject.*
    "lastPacket": Fluent.Object.lastObject //make lastPacket.* an alias for lastObject.*
}

const $ = Fluent.Matcher().starter;

//Object.prototype.getName = function() { 
//   var funcNameRegex = /function (.{1,})\(/;
//   var results = (funcNameRegex).exec((this).constructor.toString());
//   return (results && results.length > 1) ? results[1] : "";
//};

var self = {
    load: function(rulesRaw){
        self.rulesRaw = rulesRaw;
        self.rules = eval(self.rulesRaw);
        const builder = new Matcher.Builder()
        self.rules.forEach(function(r){
            builder.append(r);
        });
    },
}

module.exports = self;
