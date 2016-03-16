#!/usr/bin/node --harmony-proxies
/**
 * Created by timo on 2/26/16.
 */
const fs = require('fs');
const argv = require('minimist')(process.argv.slice(2));
const through2  = require('through2');
const JSONStream = require('JSONStream');
const es = require('event-stream')
const Matchbox = require(__dirname + '/../core/matchbox.js');

var rulesRaw = '';

function showHelp(){
    console.log(
        'Usage: ' + __filename + ' [OPTIONS] rules \n'+
        '\n'+
        'rules              : path to the rule file\n'+
        'OPTIONS:\n'+
        '   -h              : print this help\n'
    );
    process.exit();
};

try{
    var path = argv._[0]
    if(typeof path == 'string'){
        rulesRaw = fs.readFileSync(argv._[0], {encoding: 'utf-8'});
    }
    if(rulesRaw.length <= 0){
        throw new Error('file empty');
    }
} catch(e){
    console.error('Failed reading rules: ' + e);
    showHelp();
}

try{
    const matchbox = new Matchbox(rulesRaw);
} catch(e) {
    console.error('Failed initializung sandbox: ' + e);
    showHelp();
}

// help
if(argv.h){
    showHelp();
}

process.stdin
    .pipe(JSONStream.parse(true))
    .pipe(es.mapSync(function(obj) {
        matchbox.match(obj);
        return obj;
    }));
