/**
 * Created by timo on 2/26/16.
 */

var fs = require('fs');
var xml2js = require('xml2js');

var PdmlParser = function(file) {


    var parsePacket = function(packet) {
        var res = new Object();

        if(packet.proto) {
            for(var i in packet.proto) {
                var proto = packet.proto[i];
                var name = proto["$"].name;
                if(res[name]!=undefined) {
                    console.log("Overwriting element with key "+name);
                }
                var entry = res[name] = new Object();
                for(var j in proto.field) {
                    var field = proto.field[j];
                    var key = field["$"].name;
                    if(key.indexOf(name)!=-1) key = key.substring(name.length+1);
                    if(entry[key]!=undefined) {
                        if(!(entry[key] instanceof  Array)) {
                            entry[key] = [entry[key]];
                        }
                        entry[key].push(field["$"].show);
                    } else {
                        entry[key] = field["$"].show;
                    }
                }
            }
        }

        if(res.geninfo && res.geninfo.num) {
            res.id= res.geninfo.num;
        }
        return res;
    };

    this.parseStdin = function(cb) {
        this.parseStream(process.stdin,cb);
    };

    this.parseStream = function(packetStream,cb) {
        var parser = new xml2js.Parser();
        var packets = new Array();
        packetStream.pipe(require('split')("</packet>",null,{ trailing: false })).on('data', function(line) {
            line = line.substr(line.indexOf("<packet>"))+"</packet>";

            parser.parseString(line,function(err,result) {
                var packet = parsePacket(result.packet);
                cb(packet);
            });
        }).on('end',function() {
            console.log("Stream finished");
        });

    };

    this.parseFile = function(filename,cb) {
        var parser = new xml2js.Parser();
        fs.readFile(filename, function(err, data) {
            parser.parseString(data, function (err, result) {
                if(result && result.pdml && result.pdml.packet)  {
                    for(var key in result.pdml.packet) {
                        var packet = result.pdml.packet[key];
                        cb(parsePacket(packet));
                    }
                }
                console.log("File finished");

            });
        });
    }

};
module.exports = PdmlParser;
