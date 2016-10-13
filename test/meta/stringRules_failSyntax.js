/* global $ */

[
    $.match(function(obj) {
        //Do some checks here on packet struct
        return true; //return true on match
    }).then(function(obj) {
        console.log('match');
    }),
    ----->>>> THIS IS A SYNTAX ERROR!!!! <<<-----
];
