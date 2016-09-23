const path = require('path');
const MODULES_DIR = path.join(__dirname, 'core');

module.exports = {
  Fluent: require(path.join(MODULES_DIR, 'fluent.js')),
  Matcher: require(path.join(MODULES_DIR, 'matcher.js')),
  Matchbox: require(path.join(MODULES_DIR, 'matchbox.js'))
};
