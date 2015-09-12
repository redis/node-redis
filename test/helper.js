'use strict';

var assert = require("assert");
var path = require('path');
var config = require("./lib/config");
var RedisProcess = require("./lib/redis-process");
var rp;

function startRedis (conf, done) {
    RedisProcess.start(function (err, _rp) {
        rp = _rp;
        return done(err);
    }, path.resolve(__dirname, conf));
}

// don't start redis every time we
// include this helper file!
if (!process.env.REDIS_TESTS_STARTED) {
  process.env.REDIS_TESTS_STARTED = true;

  before(function (done) {
      startRedis('./conf/redis.conf', done);
  });

  after(function (done) {
      if (rp) rp.stop(done);
  });
}

module.exports = {
    stopRedis: function (done) {
        rp.stop(done);
    },
    startRedis: function (conf, done) {
        startRedis(conf, done);
    },
    isNumber: function (expected, done) {
        return function (err, results) {
            assert.strictEqual(null, err, "expected " + expected + ", got error: " + err);
            assert.strictEqual(expected, results, expected + " !== " + results);
            assert.strictEqual(typeof results, "number", "expected a number, got " + typeof results);
            if (done) return done();
        };
    },
    isString: function (str, done) {
        return function (err, results) {
            assert.strictEqual(null, err, "expected string '" + str + "', got error: " + err);
            assert.equal(str, results, str + " does not match " + results);
            if (done) return done();
        };
    },
    isNull: function (done) {
        return function (err, results) {
            assert.strictEqual(null, err, "expected null, got error: " + err);
            assert.strictEqual(null, results, results + " is not null");
            if (done) return done();
        };
    },
    isError: function (done) {
        return function (err, results) {
            assert(err instanceof Error, "err is not instance of 'Error', but an error is expected here.");
            if (done) return done();
        };
    },
    isNotError: function (done) {
        return function (err, results) {
            assert.strictEqual(err, null, "expected success, got an error: " + err);
            if (done) return done();
        };
    },
    isType: {
        number: function (done) {
            return function (err, results) {
                assert.strictEqual(null, err, "expected any number, got error: " + err);
                assert.strictEqual(typeof results, "number", results + " is not a number");
                if (done) return done();
            };
        },
        positiveNumber: function (done) {
            return function (err, results) {
                assert.strictEqual(null, err, "expected positive number, got error: " + err);
                assert.strictEqual(true, (results > 0), results + " is not a positive number");
                if (done) return done();
            };
        }
    },
    match: function (pattern, done) {
        return function (err, results) {
            assert.strictEqual(null, err, "expected " + pattern.toString() + ", got error: " + err);
            assert(pattern.test(results), "expected string '" + results + "' to match " + pattern.toString());
            if (done) return done();
        };
    },
    serverVersionAtLeast: function (connection, desired_version) {
        // Return true if the server version >= desired_version
        var version = connection.server_info.versions;
        for (var i = 0; i < 3; i++) {
            if (version[i] > desired_version[i]) return true;
            if (version[i] < desired_version[i]) return false;
        }
        return true;
    },
    allTests: function (cb) {
        [undefined].forEach(function (options) { // add buffer option at some point
            describe(options && options.return_buffers ? "returning buffers" : "returning strings", function () {
                ['hiredis', 'javascript'].forEach(function (parser) {
                    cb(parser, "/tmp/redis.sock", config.configureClient(parser, "/tmp/redis.sock", options));
                    ['IPv4', 'IPv6'].forEach(function (ip) {
                        cb(parser, ip, config.configureClient(parser, ip, options));
                    });
                });
            });
        });
    },
    removeMochaListener: function () {
        var mochaListener = process.listeners('uncaughtException').pop();
        process.removeListener('uncaughtException', mochaListener);
        return mochaListener;
    },
    callFuncAfter: function (func, max) {
        var i = 0;
        return function () {
            i++;
            if (i === max) {
                func();
            }
        };
    }
};
