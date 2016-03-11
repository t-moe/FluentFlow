require('harmony-reflect');
const NodeVM = require('vm2').NodeVM;
const UglifyJS= require('uglify-js');

'use strict';

const MATCHBOX_ENV = __dirname + '/matchboxenv.js';
const MATCHBOX_ENV_HIDDEN_ATTRS = [ 'load' ];

module.exports = function(rulesRaw, sandbox){
    sandbox = sandbox || {};
    // parse javascript code (check for errors)
    UglifyJS.parse(rulesRaw);
    //get a new matchbox environment in a vm
    const vm = new NodeVM({
        require: true,
        requireExternal: true,
        sandbox: sandbox,
    });
    const matchbox = vm.run("module.exports = require('"+ MATCHBOX_ENV +"')", __filename);
    vm.call(matchbox.load, rulesRaw);

    return new Proxy(matchbox, {
        apply: function(target, thisArg, argumentsList) {
            vm.call(thisArg[target], argumentsList);
        },
        // return a wrapper function to the sandbox
        get: function(target, name) {
            if(MATCHBOX_ENV_HIDDEN_ATTRS.indexOf(name) != -1) {
                throw new Error('sandbox attribute hidden: ' + name);
            }
            return target[name];
        }
    });
};
