require('harmony-reflect');
const NodeVM = require('vm2').NodeVM;

'use strict';

const MATCHBOX_ENV = __dirname + '/matchboxenv.js';
const MATCHBOX_ENV_HIDDEN_ATTRS = [ 'load' ];

module.exports = function(rules, sandbox){
    sandbox = sandbox || {};
    //get a new matchbox environment in a vm
    const vm = new NodeVM({
        require: true,
        requireExternal: true,
        sandbox: sandbox,
    });
    const matchbox = vm.run("module.exports = require('"+ MATCHBOX_ENV +"')", __filename);
    vm.call(matchbox.load, rules);

    return new Proxy(matchbox, {
        apply: function(target, thisArg, argumentsList) {
            vm.call(thisArg[target], argumentsList);
        },
        // return a wrapper function to the sandbox
        get: function(target, name) {
            if(MATCHBOX_ENV_HIDDEN_ATTRS.indexOf(name) != -1) {
                throw new Error('Sandbox attribute hidden: ' + name);
            }
            return target[name];
        }
    });
};
