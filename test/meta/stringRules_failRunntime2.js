/* global $ */

[
  $.match(function (obj) {
    return true;
  }).then(function (cb, obj) {
    0(); // runntime exception
    console.log('match');
    cb();
  })
];
