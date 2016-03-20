require('harmony-reflect');
const util = require('util');
const EventEmitter = require('events');
const Module = module.constructor;
const NodeVM = require('vm2').NodeVM;
const UglifyJS = require('uglify-js');

'use strict';

const MATCHBOX_ENV = __dirname + '/matchboxenv.js';
const MATCHBOX_ENV_HIDDEN_ATTRS = [ 'load' ];

module.exports = function(rulesRaw, vmoptions){
    vmoptions = vmoptions || {};
    vmoptions.require = true;
    vmoptions.requireExternal = true;
    // parse javascript code (check for errors)
    const vm = new NodeVM(vmoptions);
    if(vmoptions.events){
        const events = vmoptions.events;
        for (var event in events) {
            if (events.hasOwnProperty(event)) {
                vm.on(event, events[event]);
            }
        }
    }
    const matchbox = vm.run('module.exports = require("'+ MATCHBOX_ENV +'");', __filename);
    vm.call(matchbox.load, rulesRaw);
    return new Proxy(matchbox, {
        apply: function(target, thisArg, argumentsList) {
            vm.call(thisArg[target], argumentsList);
        },
        // return a wrapper function to the sandbox
        get: function(target, name) {
            if(MATCHBOX_ENV_HIDDEN_ATTRS.indexOf(name) != -1) {
                throw new Error('matchbox attribute hidden: ' + name);
            }
            return target[name];
        }
    });
};
