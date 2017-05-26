'use strict'

var index
function lazyIndex () {
  return index || require('../')
}

/**
 * @description Print a debug statement if in debug mode
 */
function debug () {
  if (lazyIndex().debugMode) {
    console.error.apply(null, arguments)
  }
}

module.exports = debug
