const Fluent = require(__dirname + '/fluent.js');
const Matcher = require(__dirname + '/matcher.js');

'use strict';

/*eslint-disable no-unused-vars */
const $ = Fluent.Matcher().starter;
const m = new Matcher();
const objectFluent = Fluent.Object();
const currentObject = objectFluent.currentObject;
const lastObject = objectFluent.lastObject;
/*eslint-disable no-unused-vars */

// move console to local scope, somehow we can not ovewrite global.console
// might be node.js related
var console = global.console;

const self = {
  setConsole: function (newConsole) {
    console = newConsole;
  },
  load: function (rulesRaw) {
    self.rulesRaw = rulesRaw || '';
    self.rules = eval(self.rulesRaw); // eslint-disable-line no-eval
    const builder = new Matcher.Builder();
    if (!(self.rules instanceof Array)) {
      throw new Error('No rules found');
    }
    self.rules.forEach(function (r) {
      if (self.rules instanceof Array) {
        builder.append(r.end());
      }
    });
    m.addRules(builder.rules);
  },
  matchNext: function (obj) {
    m.matchNext(obj);
  }
};

module.exports = self;
