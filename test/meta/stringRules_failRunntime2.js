/* global $ */

[
  $.match(function (obj) {
    return true;
  }).then(function (obj) {
    0(); // runntime exception
    console.log('match');
  })
];
