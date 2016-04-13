/* global $ */

// emit something @ initialization
function emit () {
  console.log('log');
  console.error('error');
}
emit();

[
  $.match(function (obj) {
    // emit somehting @ evaulation
    emit();
    return true; // return true on match
  }).then(function (obj) {})
];
