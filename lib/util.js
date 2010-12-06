if (process.versions.node.match(/^0.3/)) {
    exports.util = require("util");
} else {
    // This module is called "sys" in 0.2.x
    exports.util = require("sys");
}
