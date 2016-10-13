/* global $ */

[
  $.match(function (obj) {
    0(); // runntime exception
    return true;
  }).then(function (obj) {
    console.log('match');
  })
];
