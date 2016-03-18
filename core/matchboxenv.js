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
        const builder = new Matcher.Builder()
        if(!(self.rules instanceof Array)){
            throw new Error('No rules found');
        }
        self.rules.forEach(function(r){
            if(self.rules instanceof Array){
                builder.append(r.end());
            }
        });
        m.addRules(builder.rules);
    },
    matchNext: function(obj){
        m.matchNext(obj);
    }
};

module.exports = self;
