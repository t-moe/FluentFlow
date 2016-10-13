const path = require('path');
const Fluent = require(path.join(__dirname, 'fluent.js'));
const Matcher = require(path.join(__dirname, 'matcher.js'));

'use strict';

/* eslint-disable no-unused-vars */
const $ = Fluent.Matcher().starter;
const m = new Matcher();
const objectFluent = Fluent.Object();
const currentObject = objectFluent.currentObject;
const lastObject = objectFluent.lastObject;
/* eslint-disable no-unused-vars */

// move console to local scope, somehow we can not ovewrite global.console
// might be node.js related
var console = global.console;

module.exports = {
  setConsole: function (newConsole) {
    console = newConsole;
  },
  load: function (rulesRaw) {
    rulesRaw = rulesRaw || '';
    const rules = eval(rulesRaw); // eslint-disable-line no-eval
    if (!(rules instanceof Array)) {
      throw new Error('No rules found');
    }
    const builder = new Matcher.Builder();
    rules.forEach(function (r) {
      if (rules instanceof Array) {
        builder.append(r.end());
      }
    });
    m.addRules(builder.rules);
  },
  matchNext: function () {
    m.matchNext.apply(this, arguments);
  }
};

