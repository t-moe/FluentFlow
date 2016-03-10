/**
 * Created by timo on 2/26/16.
 */

var Matcher = require("./core/matcher.js")
var Fluent = require("./core/fluent.js")

var intern = {};


//-----------Pdml specific stuff --------------------------------
var PdmlParser = require("./parsers/pdmlParser.js")

intern.pdmlFields = { //fields which will be made available on packet.field.* or lastPacket.field.*
    "tcp" : ["srcport","dstport"],
    "udp" : ["srcport","dstport"],
    "ip" : ["src","dst"],
    "http" : {}
};

intern.pdmlStarters = {
    "packet": Fluent.Object.currentObject, //make packet.* an alias for currentObject.*
    "lastPacket": Fluent.Object.lastObject //make lastPacket.* an alias for lastObject.*
};

//---------------------------------------------------------------

intern.startup = function(fields,starters) {

    var r = require("./rules.js");

    var o = Fluent.Object(fields,starters);
    var when = Fluent.Matcher().starter;

    r = r(o.currentObject, o.lastObject,when);

    var builder = new Matcher.Builder();
    for (var i in r) {
        builder.append(r[i].end());
    }

    builder.printRules();

    var matcher = new Matcher();
    matcher.addRules(builder.rules);

    intern.callback = function (object) {
        matcher.matchNext(object);
    };

    return true;
};

intern.runLive = function(intf) {
    var parser = new PdmlParser();
    if(intern.startup(intern.pdmlFields,intern.pdmlStarters)) {
        var spawn = require('child_process').spawn;
        var ts = spawn('tshark', ['-i', intf, "-T","pdml"]);
        parser.parseStream(ts.stdout,intern.callback);

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
            if(intern.startup(intern.pdmlFields,intern.pdmlStarters)) {
                parser.parseFile(filename, intern.callback);
            }
        } else {
            console.error("file "+filename+" is not accessible");
        }
    });
};

intern.runPipePdml = function() {
    var parser = new PdmlParser();
    if(intern.startup(intern.pdmlFields,intern.pdmlStarters)) {
        parser.parseStdin(intern.callback);
    }
};

intern.showHelp = function() {
    console.log("FluentFlow Command Line Options:");
    console.log("-h\t\t\tdisplay help");
    console.log("-i\t<interface>\tsniff from interface using tshark");
    console.log("-p\t<file>\t\tread from pdml file or '-' to read from stdin");
    //console.log("-t\tfile\t\tread from tff json file");
};



var argv = require('minimist')(process.argv.slice(2));

if(argv.i && argv.p) {
    console.error("You cannot specify both -p and -i");
} else if(!(argv.h) && typeof (argv.i) == "string") {
    intern.runLive(argv.i);
} else if(!(argv.h) && typeof (argv.p) == "string") {
    if(argv.p=="-") { //read from stdin
        intern.runPipePdml();
    } else {
        intern.runOfflinePdml(argv.p);
    }
} else {
    intern.showHelp();
}

