# FluentFlow
FluentFlow is matching engine which lets you easily define 'followed by'-relations in a flow of json objects. Rules can be written in javascript as plain functions or using a fluent API.

[![Travis](https://img.shields.io/travis/t-moe/FluentFlow.svg)](https://travis-ci.org/t-moe/FluentFlow)
[![Coverage Status](https://coveralls.io/repos/github/t-moe/FluentFlow/badge.svg)](https://coveralls.io/github/t-moe/FluentFlow)
[![Codacy Badge](https://api.codacy.com/project/badge/grade/72b447b11ed140198b1d549680880e13)](https://www.codacy.com/app/timolang/FluentFlow)

## Command line interface

### Installation
```shell
$ sudo npm install -g fluentflow 
```

### Usage
```
Usage: fluentflow.js [OPTIONS] rulesFile

rulesFile          : path to the rules file
OPTIONS:
   -j JSONPath     : JSONPath expression
   -t              : test if rules are valid
   -h              : print this help
```

### Getting started
Configure rules.js:
```javascript
[
    // Check if somebody forked this repository after submitting an issue
    // Reverse order because the github api displays events in this order
    $.match(function(currentObject) {
        return currentObject.type == "ForkEvent"
    }).followedBy.match(function(currentObject, lastObject){
        return currentObject.type == "IssuesEvent"
        && currentObject.actor.login == lastObject.actor.login;
    }).then(function(fork, issue){
        console.log('User: ' + fork.actor.login + ' forked after writing issue: ' + issue.id);
    })
];
```

Start FluentFlow:
```shell
$ curl -s https://api.github.com/repos/t-moe/FluentFlow/events | fluentflow rules.js -j '*'
```
  * Note: -j '*' because github responds with an array of json objects which we should split before processing

## Library

### Installation
```shell
$ npm install --save fluentflow 
```

### Usage

```javascript
const FluentFlow = require("fluentflow");
const Fluent = FluentFlow.Fluent;
const $ = Fluent.Matcher().starter;

// Build the rules
const builder = new FluentFlow.Matcher.Builder();
builder.append(
    $.match(function(obj){return obj.bar===5;}).then(console.log).end(),
    $.match(function(obj){return !!obj.fooo;}).then(console.log).end()
);

// Add rules to matcher
const matcher = new FluentFlow.Matcher();
matcher.addRules(builder.rules);

// Match objects
const objects = [
    {"bar":2},
    {"bar":5},
    {"bar":7},
    {"fooo":42}
];

objects.forEach(function(obj) {
    matcher.matchNext(obj);
});
```

#### Fluent API

```javascript
const FluentFlow = require("fluentflow");
const Fluent = FluentFlow.Fluent;
const $ = Fluent.Matcher().starter;

const objectFluent = Fluent.Object({
    // register fields
    'bar' : []
});
const currentObject = objectFluent.currentObject;
const lastObject = objectFluent.lastObject;

// Build the rules
const builder = new FluentFlow.Matcher.Builder();
builder.append(
    $.match(currentObject.fieldNamed("bar").equals(5)).then(console.log).end(),
    $.match(currentObject.fieldNamed("fooo").exists).then(console.log).end()
);

// Add rules to matcher
const matcher = new FluentFlow.Matcher();
matcher.addRules(builder.rules);

// Match objects
const objects = [
    {"bar":2},
    {"bar":5},
    {"bar":7},
    {"fooo":42}
];

objects.forEach(function(obj) {
    matcher.matchNext(obj);
});
```
#### Sandbox

```javascript
const FluentFlow = require("./modules");

const rules =   '[                                                                      \
                $.match(function(obj){return obj.bar===5;}).then(console.log).end(),    \
                $.match(function(obj){return !!obj.fooo;}).then(console.log).end()      \
                ]' ;

const matchbox = new FluentFlow.Matchbox(rules);

const objects = [
    {"bar":2},
    {"bar":5},
    {"bar":7},
    {"fooo":42}
];

objects.forEach(function(obj) {
    matchbox.matchNext(obj);
});
```

## Quickstart

In the simplest case, you register a single matcher function (with `match`) which will be executed to check every object. With `then` you can specify a callback which will be executed if the rule matched.

```javascript
$.match(function(object) { // add object checking callback 
        // do some checks here
        return object.tcp && object.tcp.dstport==80; //return true on match
    }).then(function(object) {
        console.log("Match!",object);
    });
```

Followed by relations can be described using the `followedBy` keyword. The callbacks registered with `match` or `then` will have access to previously matched objects.

```javascript
$.match(function(object) {
        // do some checks here
        return object.tcp && object.tcp.dstport==80; //return true on match
    }).followedBy.match(function(object, lastobject){
        //Do some checks here on object OR lastobject struct
        return object.http && object.ip.src==lastobject.ip.dst; //return true on match
    }).then(function(obj2, obj1) {
        console.log("Match!", obj1, obj2);
    });
```

## Matching API

### Object: $
Used to start phrasing a rule. No options, no special props.  
**Available Members:** _match_, _oneOf_

### Function: match(func1, func2, ..., func_n)
Registers one or multiple functions which will be called to determine if the current "rule" matches. The functions must return `true` if the rule "matched". The first passed function will be called first, and the second function will only be called if the first returned `true` (and so on).  
  
If a function takes only one parameter, it will receive the current object as argument. If a function takes multiple parameters then the function receives the previous object (and all objects before the previous) as argument as well. In the latter case the function will be called for every combination of the current/last objects.  
  
Performance Hint: If you need access to the last Object (by adding a second parameter), add a function  before it (which uses only one parameter) to filter out some of the objects.

A matcher function can also return `undefined` and submit the result async by invoking `this.next` with a boolean.

**Available Members:** _followedBy_, _then_

### Function: oneOf(chain1, chain2, ..., chain_n)
Takes one or multiple subchains and only contains with the following "rules" (`followedBy`), when one of the passed chain matched.

Example:
```javascript
$.oneOf( $.match(f1),
         $.match(f2).followedBy.match(f3)
       ).then(cb)
```  
The final callback `cb` will only be called if either the first matching function `f1` matched, or `f2` matched followed by a object matching `f3`.

**Available Members:** _followedBy_, _then_

### Function: then(func1, func2, ..., func_n)
Registers one or multiple function which will be called after the current "rule" has matched.  
  
If the functions take only one parameter, then they will only be called once, with the current object as argument. If the function takes multiple parameters then the function receives all previous objects as well, and will be called for every combination.

The functions can return a blocker-function or an array of blocker functions. The matching will be delayed until all blocker functions returned false at least once.

Example see below.

**Available Members:** _followedBy_, _then_

### Object: followedBy
Starts describing a new rule, which can only match once the previous rule has matched. The functions registered with `match` of the newly created rule will receive the objects that matched in the last rule as 2nd, 3rd, ... parameter.

Example:
```javascript
$.match(f1).followedBy.match(f2).then(cb)
```
The final callback `cb` will only be called if `f1` matched followed by a object matching `f2`.

**Available Members:** _match_, _oneOf_




## Using the FluentAPI to build the matcher function

_TODO: replace packet/lastPacket stuff in this section with something more generic_  
_Take a look at [pdml2flow](https://github.com/Enteee/pdml2flow) if you want to use fluentflow with wireshark_


Instead of using a callback function in `match` you can also use the fluent API to automatically build a such function.

### Examples

<!---

function printy(rule) {
    console.log("* `"+rule+"`  ");
    console.log("will translate into  ");
    console.log("`"+eval(rule+".toString()")+"`");
    console.log();
}

printy("packet.fieldNamed(\"tcp.dstport\").equals(80)");

-->

| FluentApi | Javascript |
| --------- | ---------- |
| `packet.fieldNamed("tcp.dstport").equals(80)` | `function (packet){return (parseInt(packet.tcp.dstport)==80);}` |
| `packet.fieldNamed("tcp.dstport").exists.and.equals(80)` | `function (packet){return (packet && packet.tcp&& typeof(packet.tcp.dstport) != "undefined")&&(parseInt(packet.tcp.dstport)==80);}` |
| `packet.fieldNamed("tcp.dstport").equals(80).or.equals(443)` | `function (packet){return (parseInt(packet.tcp.dstport)==80)||(parseInt(packet.tcp.dstport)==443);}` |
| `packet.fieldNamed("tcp.dstport").equals(lastPacket)` | `function (packet,lastpacket){return (packet.tcp.dstport==lastpacket.tcp.dstport);}` |
| `packet.fieldNamed("udp.src").exists.and.equals(lastPacket.fieldNamed("tcp.src"))` | `function (packet,lastpacket){return (packet && packet.udp&& typeof(packet.udp.src) != "undefined")&&(packet.udp.src==lastpacket.tcp.src);}` |
| `packet.fieldNamed("tcp.dstport").not.equals(lastPacket).or.equals(0)` | `function (packet,lastpacket){return !(packet.tcp.dstport==lastpacket.tcp.dstport)||(parseInt(packet.tcp.dstport)==0);}` |
| `packet.fieldNamed("tcp.dstport").between(0,1024)` | `function (packet){return (parseInt(packet.tcp.dstport)>0&&parseInt(packet.tcp.dstport)<1024);}` |
| `packet.fieldNamed("tcp.dstport").between(0,lastPacket)` | `function (packet,lastpacket){return (parseInt(packet.tcp.dstport)>0&&parseInt(packet.tcp.dstport)<parseInt(lastpacket.tcp.dstport));}` |
| `packet.fieldNamed("http.host").contains("foo")` | `function (packet){return (packet.http.host.indexOf("foo")>=0);}` |
| `packet.fieldNamed("http.host").not.matches(/abc\d+/).and.matches(/.*\.ch/)` | `function (packet){return !(/abc\d+/.test(packet.http.host))&&(/.*\.ch/.test(packet.http.host));}` |

  
Instead of using `fieldNamed("tcp.dstport")` you can also use `field.tcp.dstport`. This only works for properties which have been registered (TODO: explain).

## Unit tests

```shell
$ npm test
```
