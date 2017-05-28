'use strict'

var index = {
  debugMode: /\bredis\b/i.test(process.env.NODE_DEBUG)
}
// Lazy load the main file
process.nextTick(() => (index = require('../')))

/**
 * @description Print a debug statement if in debug mode
 */
function debug () {
  if (index.debugMode) {
    console.error.apply(null, arguments)
  }
}

module.exports = debug
