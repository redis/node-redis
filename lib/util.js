if (process.versions.node.match(/^0.2/)) {
    // This module is called "sys" in 0.2.x
    exports.util = require("sys");
} else {
    exports.util = require("util");
}
