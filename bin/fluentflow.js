#!/usr/bin/node --harmony-proxies
/**
 * Created by timo on 2/26/16.
 */
const fs = require('fs');
const argv = require('minimist')(process.argv.slice(2));
const JSONStream = require('JSONStream');
const es = require('event-stream')
const Matchbox = require(__dirname + '/../core/matchbox.js');

var rulesRaw = '';

function showHelp(ret){
    console.log(
        'Usage: ' + __filename + ' [OPTIONS] rulesFile\n'+
        '\n'+
        'rulesFile          : path to the rules file\n'+
        'OPTIONS:\n'+
        '   -j JSONPath     : JSONPath expression\n' +
        '   -t              : test if rules are valid\n' +
        '   -h              : print this help\n'
    );
    process.exit(ret);
};

// help
if(argv.h){
    showHelp(0);
}

try{
    var rulesFile = argv._[0]
    if(typeof rulesFile != 'string'){
        throw new Error('rulesFile missing');
    }
    if(!fs.statSync(rulesFile).isFile()){
        throw new Error('rulesFile not a file');
    }
    rulesRaw = fs.readFileSync(argv._[0], {encoding: 'utf-8'});
    if(rulesRaw.length <= 0){
        throw new Error('rulesFile empty');
    }
} catch(e){
    console.error(e);
    showHelp(1);
}

// Read jsonPath, default: don't split objects (true)
var jsonPath = true;
if(argv.j){
    jsonPath = argv.j;
}



try{
    const matchbox = new Matchbox(rulesRaw);
} catch(e) {
    console.error('Failed initializing matchbox');
    if(e.message && e.line){
        console.error(e.message + ' at line: ' + e.line);
    } else {
        console.error(e);
    }
    process.exit(1);
}

if(argv.t){
    process.exit(0);
}

process.stdin
    .pipe(JSONStream.parse(jsonPath))
    .pipe(es.mapSync(function(obj) {
        matchbox.matchNext(obj);
        return obj;
    }));
