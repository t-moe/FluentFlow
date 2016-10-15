/* global $ */

[
  $.match(function (obj) {
    0(); // runntime exception
    return true;
  }).then(function (cb, obj) {
    console.log('match');
    cb();
  })
];
