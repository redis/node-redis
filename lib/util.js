// Support for very old versions of node.  At some point, we should abandon this.
var minor = process.versions.node.split('.')[1];
if (minor > 2) {
    exports.util = require("util");
} else {
    exports.util = require("sys");
}
