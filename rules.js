function printId(pref) {
    return function() {
        var args = Array.prototype.slice.call(arguments);
        for (var i = 0; i < args.length; i++) {
            args[i] = args[i].id;
        }
        if (pref) {
            args.unshift(pref);
        }
        console.log.apply(null,args);
    }
};

[
    // Rule: A matcher function on a single currentObject
    $.match(function(currentObject) {
        //Do some checks here on currentObject struct
        return false; //return true on match
    }).then(printId("My 1st Rule matched on currentObject with id:")),

    // Rule: Check ip
    $.match(function(currentObject) {
        return currentObject._Flow__frames.ip.host.raw.indexOf("172.20.10.2") != -1;
    }).then(printId("My 1.1st Rule matched on currentObject with id:")),

    // Rule: Check ip and ip
    $.match(function(currentObject) {
        return currentObject._Flow__frames.ip.host.raw.indexOf("172.20.10.2") != -1;
    }).followedBy.match(function(currentObject, lastObject){
        return currentObject._Flow__frames.ip.host.raw.indexOf("172.20.10.2") != -1;
    }).then(printId("My 1.2st Rule matched on currentObject with id:")),

    // Rule: A matcher function matching on a single currentObject followed by another currentObject which has to match something else
    $.match(function(currentObject) {
        //Do some checks here on currentObject struct
        return currentObject.tcp.dstport==80; //return true on match
    }).followedBy.match(function(currentObject, lastcurrentObject){
        //Do some checks here on currentObject OR lastcurrentObject struct
        return currentObject.http && currentObject.ip.src==lastcurrentObject.ip.dst; //return true on match
    }).then(printId("My 2nd Rule matched on currentObject-chain with ids:")),

/*
    // Rule: Using fluent API to describe obj matching function
    $.match(currentObject.field.tcp.dstport.equals(80))
        .then(printId("rule3a"))
            .followedBy
            .match(currentObject.fieldNamed("http").exists)
            .then(printId("rule3b")),

    // Rule: Use two alternative matcher functions where at least one must match before a third matcher function is executed
    $.oneOf(
        $.match(currentObject.fieldNamed("tcp.dstport").equals(80)),
        $.match(currentObject.fieldNamed("tcp.dstport").equals(443))
    )
    .then(printId("rule4a"))
        .followedBy
        .match(currentObject.fieldNamed("http").exists)
        .then(printId("rule4b")),

    // Rule: Matches a http currentObject followed by any currentObject from the same src ip
    $.match(currentObject.fieldNamed("http").exists)
        .followedBy
        .match(currentObject.fieldNamed("ip.src").equals(lastObject))
        .then(printId("rule5")),

    // Rule: Matches a http currentObject followed by a udp currentObject from the same src ip
    $.match(currentObject.fieldNamed("http").exists)
        .followedBy
        .match(
            currentObject.fieldNamed("udp.src").exists
            .and
            .equals(lastObject.fieldNamed("tcp.src"))
        )
        .then(printId("rule6"))
*/

];
