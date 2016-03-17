[
    // Check if somebody forked this repository after submitting an issue
    // Reverse order because the github api displays events in this order
    $.match(function(currentObject) {
        return currentObject.type == "ForkEvent";
    }).followedBy.match(function(currentObject, lastObject){
        return currentObject.type == "IssuesEvent"
        && currentObject.actor.login == lastObject.actor.login;
    }).then(function(issue, fork){
        console.log(arguments);
        console.log('User: ' + fork.actor.login + ' forked after writing issue: ' + issue.id);
    })
];
