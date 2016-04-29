'use strict';

var index = require('../');

function debug () {
    if (index.debug_mode) {
        console.error.apply(null, arguments);
    }
}

module.exports = debug;
