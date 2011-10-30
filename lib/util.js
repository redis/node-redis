var minor = process.versions.node.split('.')[1];
if (minor > 2) {
    exports.util = require("util");
} else {
    // This module is called "sys" in 0.2.x
    exports.util = require("sys");
}
