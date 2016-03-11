// check if module inclusion works
exports.testMatchbox = function(test) {
    modules = require(__dirname + '/../modules.js');
    test.done();
};
