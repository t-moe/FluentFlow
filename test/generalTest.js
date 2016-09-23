const path = require('path');

// check if module inclusion works
exports.testMatchbox = function (test) {
  require(path.join(__dirname, '..', 'modules.js'));
  test.done();
};
