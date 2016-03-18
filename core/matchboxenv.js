const Fluent = require(__dirname + '/fluent.js');
const Matcher = require(__dirname + '/matcher.js');

'use strict';

const $ = Fluent.Matcher().starter;
const m = new Matcher();
const objectFluent = Fluent.Object();
const currentObject = objectFluent.currentObject;
const lastObject = objectFluent.lastObject;

const self = {
    load: function(rulesRaw){
        self.rulesRaw = rulesRaw || '';
        self.rules = eval(self.rulesRaw);
        if(!self.rules){
            throw new Error('No rules defined');
        }
        const builder = new Matcher.Builder()
        self.rules.forEach(function(r){
            builder.append(r.end());
        });
        m.addRules(builder.rules);
    },
    matchNext: function(obj){
        m.matchNext(obj);
    }
};

module.exports = self;
