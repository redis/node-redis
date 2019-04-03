'use strict';

var index = require('../');

function debug () {
    if (index.debug_mode) {
        var data = Array.from(arguments);
        data.unshift(new Date().toISOString());
        console.error.apply(null, data);
    }
}

module.exports = debug;
