'use strict';

var index = require('../');

function debug (msg) {
    if (index.debug_mode) {
        console.error(msg);
    }
}

module.exports = debug;
