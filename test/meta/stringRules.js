/* global $ */

[
  // ----- Rule 1: A matcher function on a single object ---------------------
  $.match(function (obj) {
    // Do some checks here on packet struct
    return true; // return true on match
  }).then(function (cb, obj) { cb(); })
];
