'use strict';

// Using a predefined object with this prototype is faster than calling `Object.create(null)` directly
// This is needed to make sure `__proto__` and similar reserved words can be used
function RawObject () {}
RawObject.prototype = Object.create(null);

module.exports = RawObject;
