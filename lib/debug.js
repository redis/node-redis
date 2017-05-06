'use strict'

const index = require('../')

function debug () {
  if (index.debugMode) {
    console.error.apply(null, arguments)
  }
}

module.exports = debug
