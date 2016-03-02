/**
 * Created by timo on 2/26/16.
 */
var PdmlParser = require("./parsers/pdmlParser.js")
var Matcher = require("./core/matcher.js")

var intern = {};

intern.startup = function() {

    var r = require("./rules.js");
    var builder = new Matcher.Builder();
    for (var i in r) {
        builder.append(r[i].end());
    }

    builder.printRules();

    var matcher = new Matcher();
    matcher.addRules(builder.rules);

    intern.packetCallback = function (packet) {
        matcher.matchNext(packet);
    };

    return true;
};

intern.runLive = function(intf) {
    var parser = new PdmlParser();
    if(intern.startup()) {
        var spawn = require('child_process').spawn;
        var ts = spawn('tshark', ['-i', intf, "-T","pdml"]);
        parser.parseStream(ts.stdout,intern.packetCallback);

        ts.stderr.on('data', function (data) {
            if(data.indexOf("tshark:")==0) console.warn(""+data);
            else console.warn('tshark: ' + data);
        });
        ts.on('exit', function (code) {
            console.log('tshark process exited with code ' + code);
        });
    }
};

intern.runOfflinePdml = function(filename){
    var fs = require('fs');
    fs.access(filename, fs.F_OK, function(err) {
        if (!err) {
            var parser = new PdmlParser();
            if(intern.startup()) {
                parser.parseFile(filename, intern.packetCallback);
            }
        } else {
            console.error("file "+filename+" is not accessible");
        }
    });
};

intern.showHelp = function() {
    console.log("FluentFlow Command Line Options:");
    console.log("-h\t\t\tdisplay help");
    console.log("-i\t<interface>\tsniff from interface using tshark");
    console.log("-p\tfile\t\tread from pdml file (tshark -T pdml)");
    //console.log("-t\tfile\t\tread from tff json file");
};



var argv = require('minimist')(process.argv.slice(2));

if(argv.i && argv.p) {
    console.error("You cannot specify both -p and -i");
} else if(!(argv.h) && typeof (argv.i) == "string") {
    intern.runLive(argv.i);
} else if(!(argv.h) && typeof (argv.p) == "string") {
    intern.runOfflinePdml(argv.p);
} else {
    intern.showHelp();
}

