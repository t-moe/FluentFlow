const Fluent = require('./fluent.js');
const Matcher = require('./matcher.js');

'use strict';

const $ = Fluent.Matcher().starter;
const m = new Matcher();

const self = {
    load: function(rulesRaw){
        self.rulesRaw = rulesRaw;
        self.rules = eval(self.rulesRaw);
        const builder = new Matcher.Builder()
        self.rules.forEach(function(r){
            builder.append(r.end());
        });
        m.addRules(builder.rules);
    },
    match: function(obj){
        switch(typeof(obj)){
            case 'array':
                obj.forEach(function(obj){
                    m.matchNext(obj);
                });
            break;
            case 'object':
                m.matchNext(obj);
            break;
            default:
                throw new Error("invalid argument type:" + typeof(obj));
        }
    }
}

module.exports = self;
