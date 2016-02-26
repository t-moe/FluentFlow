/**
 * Created by timo on 2/26/16.
 */

var fs = require('fs');
var xml2js = require('xml2js');

var PdmlParser = function(file) {

    this.parseFile = function(filename,cb) {
        var parser = new xml2js.Parser();
        fs.readFile(filename, function(err, data) {
            parser.parseString(data, function (err, result) {
                var packets = new Array();
                if(result && result.pdml && result.pdml.packet)  {
                    for(var key in result.pdml.packet) {
                        var packet = result.pdml.packet[key];
                        var res = new Object();

                        if(packet.proto) {
                            for(var i in packet.proto) {
                                var proto = packet.proto[i];
                                var name = proto["$"].name;
                                var entry = res[name] = new Object();
                                for(var j in proto.field) {
                                    var field = proto.field[j];
                                    var key = field["$"].name;
                                    if(key.indexOf(name)!=-1) key = key.substring(name.length+1);
                                    entry[key] = field["$"].show;
                                }
                            }
                        }

                       packets.push(res);
                    }

                }

                cb(packets);

            });
        });
    }

};
module.exports = PdmlParser;
