const NodeVM = require('vm2').NodeVM;

'use strict';

const MATCHBOX_ENV = './matchboxenv.js';

module.exports = function(rules, sandbox){
    sandbox = sandbox || {};
    //Get a new matchbox in a vm
    const vm = new NodeVM({
        require: true,
        requireExternal: true,
        sandbox: sandbox,
    });
    const matchbox = vm.run("module.exports = require('"+ MATCHBOX_ENV +"')", __filename);
    vm.call(matchbox.load, rules);

    return {
        match : function(obj){
            switch(typeof(obj)){
                case 'array':
                    obj.forEach(function(obj){
                        vm.call(matchbox.match, obj);
                    });
                break;
                case 'object':
                    vm.call(matchbox.match, obj);
                break;
                default:
                    throw new Error("invalid argument type:" + typeof(obj));
            }
        },
    } 
};
