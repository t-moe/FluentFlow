require('harmony-reflect');
const fs = require('fs');
const path = require('path');
const util = require('util');
const EventEmitter = require('events');
const NodeVM = require('vm2').NodeVM;
const UglifyJS = require('uglify-js');

'use strict';

const MATCHBOX_ENV = path.join(__dirname, 'matchboxenv.js');
const MATCHBOX_ENV_HIDDEN_PROPERTIES = [ 'load', 'setConsole' ];
const MATCHBOX_ENV_CONSOLE_EMIT_FUNCIONS = [ 'log', 'error' ];

module.exports = function (rulesRaw, vmoptions) {
  vmoptions = vmoptions || {};
  vmoptions.require = vmoptions.require || {};
  vmoptions.require.external = true;
  vmoptions.require.root = __dirname;
  vmoptions.require.builtin = (vmoptions.require) ? vmoptions.require.builtin || ['path'] : ['path'];
  //    builtin: (vmoptions.require) ? vmoptions.require.builtin || ['fs', 'path'] : [],
  // parse javascript code (check for errors)
  UglifyJS.parse(rulesRaw);
  if (!vmoptions.novm) {
    // start a vm
    const vm = new NodeVM(vmoptions);
    // register events
    if (vmoptions.events) {
      const events = vmoptions.events;
      for (var event in events) {
        if (events.hasOwnProperty(event)) {
          vm.on(event, events[event]);
        }
      }
    }
    const matchbox = vm.run(fs.readFileSync(MATCHBOX_ENV), __filename);
    matchbox.load(rulesRaw);
    // delte all hidden properties
    MATCHBOX_ENV_HIDDEN_PROPERTIES.forEach(function (p) {
      delete matchbox[p];
    });
    return new Proxy(matchbox, {
      apply: function (target, thisArg, argumentsList) {
        thisArg[target](argumentsList);
      }
    });
  } else {
    var MatchboxEmitter = function () {
      const self = this;
      // make this an event emitter
      EventEmitter.call(this);
      // do not start a vm, instead require directly
      const matchbox = require(MATCHBOX_ENV);
      // and remove from require cache, so that subsequent requires
      // don't result in the same object beeing returned
      delete require.cache[require.resolve(MATCHBOX_ENV)];
      // register events
      if (vmoptions.events) {
        const events = vmoptions.events;
        for (var event in events) {
          if (events.hasOwnProperty(event)) {
            this.on(event, events[event]);
          }
        }
      }
      switch (vmoptions.console) {
        case 'redirect':
          // set event emitting console
          matchbox.setConsole(new Proxy(console, {
            get: function (target, property, receiver) {
              if (MATCHBOX_ENV_CONSOLE_EMIT_FUNCIONS.indexOf(property) !== -1) {
                return function (data) {
                  self.emit('console.' + property, data);
                };
              }
              return target[property];
            }
          }));
          break;
        case 'off':
          matchbox.setConsole(new Proxy(console, {
            get: function (target, property, receiver) {
              if (MATCHBOX_ENV_CONSOLE_EMIT_FUNCIONS.indexOf(property) !== -1) {
                return function () {
                  // do nothing
                };
              }
              return target[property];
            }
          }));
          break;
      }
      // load rules
      matchbox.load(rulesRaw);
      // delte all hidden properties
      MATCHBOX_ENV_HIDDEN_PROPERTIES.forEach(function (p) {
        delete matchbox[p];
      });
      return new Proxy(this, {
        get: function (target, property, receiver) {
          if (target.hasOwnProperty(property)) {
            return target[property];
          }
          return matchbox[property];
        }
      });
    };
    util.inherits(MatchboxEmitter, EventEmitter);

    return new MatchboxEmitter();
  }
};
