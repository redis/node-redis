// test runner utils, separated from mranney's test.js.

var assert = require('assert');

exports.buffers_to_strings = function buffers_to_strings(arr) {
    return arr.map(function (val) {
        return val.toString();
    });
};

exports.require_number = function require_number(expected, label, callback) {
    return function (err, results) {
        assert.strictEqual(null, err, label + " expected " + expected + ", got error: " + err);
        assert.strictEqual(expected, results, label + " " + expected + " !== " + results);
        assert.strictEqual(typeof results, "number", label);
        if (typeof callback === 'function') callback();
        return true;
    };
};

exports.require_number_any = function require_number_any(label, callback) {
    return function (err, results) {
        assert.strictEqual(null, err, label + " expected any number, got error: " + err);
        assert.strictEqual(typeof results, "number", label + " " + results + " is not a number");
        if (typeof callback === 'function') callback();
        return true;
    };
};

exports.require_number_pos = function require_number_pos(label, callback) {
    return function (err, results) {
        assert.strictEqual(null, err, label + " expected positive number, got error: " + err);
        assert.strictEqual(true, (results > 0), label + " " + results + " is not a positive number");
        if (typeof callback === 'function') callback();
        return true;
    };
};

exports.require_string = function require_string(str, label, callback) {
    return function (err, results) {
        assert.strictEqual(null, err, label + " expected string '" + str + "', got error: " + err);
        assert.strictEqual(str, results, label + " " + str + " does not match " + results);
        if (typeof callback === 'function') callback();
        return true;
    };
};

exports.require_null = function require_null(label, callback) {
    return function (err, results) {
        assert.strictEqual(null, err, label + " expected null, got error: " + err);
        assert.strictEqual(null, results, label + ": " + results + " is not null");
        if (typeof callback === 'function') callback();
        return true;
    };
};

exports.require_error = function require_error(label, callback) {
    return function (err, results) {
        assert.notEqual(err, null, label + " err is null, but an error is expected here.");
        if (typeof callback === 'function') callback();
        return true;
    };
};

exports.is_empty_array = function is_empty_array(obj) {
    return Array.isArray(obj) && obj.length === 0;
};

exports.server_version_at_least = function server_version_at_least(connection, desired_version) {
    // Return true if the server version >= desired_version
    var version = connection.server_info.versions;
    for (var i = 0; i < 3; i++) {
        if (version[i] > desired_version[i]) return true;
        if (version[i] < desired_version[i]) return false;
    }
    return true;
};


function MockLogger(){
  var self = this;
  this.msgs = [];
  this.toConsole = false;
}
MockLogger.prototype.log = function() {
  var args = Array.prototype.slice.call(arguments);
  this.msgs.push(args);
  if (this.toConsole) console.log.apply(this, args);
};
exports.MockLogger = MockLogger;
