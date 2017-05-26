'use strict'

const index = require('../')

/**
 * @description Print a debug statement if in debug mode
 */
function debug () {
  if (index.debugMode) {
    console.error.apply(null, arguments)
  }
}

module.exports = debug
