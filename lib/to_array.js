'use strict';

function to_array(args) {
  return Array.prototype.slice.call(args);
}

module.exports = to_array;
