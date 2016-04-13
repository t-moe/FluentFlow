// check if module inclusion works
exports.testMatchbox = function (test) {
  require(__dirname + '/../modules.js');
  test.done();
};
