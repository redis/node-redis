'use strict';

var assert = require('assert');
var path = require('path');
var config = require('./lib/config');
var RedisProcess = require('./lib/redis-process');
var StunnelProcess = require('./lib/stunnel-process');
var rp;
var stunnel_process;

function startRedis (conf, done, port) {
    RedisProcess.start(function (err, _rp) {
        rp = _rp;
        return done(err);
    }, path.resolve(__dirname, conf), port);
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

function arrayHelper (results) {
    if (results instanceof Array) {
        assert.strictEqual(results.length, 1, 'The array length may only be one element');
        return results[0];
    }
    return results;
}

module.exports = {
    redisProcess: function () {
        return rp;
    },
    stopRedis: function (done) {
        rp.stop(done);
    },
    startRedis: startRedis,
    stopStunnel: function (done) {
        if (stunnel_process) {
            StunnelProcess.stop(stunnel_process, done);
        } else {
            done();
        }
    },
    startStunnel: function (done) {
        StunnelProcess.start(function (err, _stunnel_process) {
            stunnel_process = _stunnel_process;
            return done(err);
        }, path.resolve(__dirname, './conf'));
    },
    isNumber: function (expected, done) {
        return function (err, results) {
            assert.strictEqual(err, null, 'expected ' + expected + ', got error: ' + err);
            results = arrayHelper(results);
            assert.strictEqual(results, expected, expected + ' !== ' + results);
            assert.strictEqual(typeof results, 'number', 'expected a number, got ' + typeof results);
            if (done) done();
        };
    },
    isString: function (str, done) {
        str = '' + str; // Make sure it's a string
        return function (err, results) {
            assert.strictEqual(err, null, "expected string '" + str + "', got error: " + err);
            results = arrayHelper(results);
            if (Buffer.isBuffer(results)) { // If options are passed to return either strings or buffers...
                results = results.toString();
            }
            assert.strictEqual(results, str, str + ' does not match ' + results);
            if (done) done();
        };
    },
    isNull: function (done) {
        return function (err, results) {
            assert.strictEqual(err, null, 'expected null, got error: ' + err);
            results = arrayHelper(results);
            assert.strictEqual(results, null, results + ' is not null');
            if (done) done();
        };
    },
    isUndefined: function (done) {
        return function (err, results) {
            assert.strictEqual(err, null, 'expected null, got error: ' + err);
            results = arrayHelper(results);
            assert.strictEqual(results, undefined, results + ' is not undefined');
            if (done) done();
        };
    },
    isError: function (done) {
        return function (err, results) {
            assert(err instanceof Error, "err is not instance of 'Error', but an error is expected here.");
            if (done) done();
        };
    },
    isNotError: function (done) {
        return function (err, results) {
            assert.strictEqual(err, null, 'expected success, got an error: ' + err);
            if (done) done();
        };
    },
    isType: {
        number: function (done) {
            return function (err, results) {
                assert.strictEqual(err, null, 'expected any number, got error: ' + err);
                assert.strictEqual(typeof results, 'number', results + ' is not a number');
                if (done) done();
            };
        },
        string: function (done) {
            return function (err, results) {
                assert.strictEqual(err, null, 'expected any string, got error: ' + err);
                assert.strictEqual(typeof results, 'string', results + ' is not a string');
                if (done) done();
            };
        },
        positiveNumber: function (done) {
            return function (err, results) {
                assert.strictEqual(err, null, 'expected positive number, got error: ' + err);
                assert(results > 0, results + ' is not a positive number');
                if (done) done();
            };
        }
    },
    match: function (pattern, done) {
        return function (err, results) {
            assert.strictEqual(err, null, 'expected ' + pattern.toString() + ', got error: ' + err);
            results = arrayHelper(results);
            assert(pattern.test(results), "expected string '" + results + "' to match " + pattern.toString());
            if (done) done();
        };
    },
    serverVersionAtLeast: function (connection, desired_version) {
        // Wait until a connection has established (otherwise a timeout is going to be triggered at some point)
        if (Object.keys(connection.server_info).length === 0) {
            throw new Error('Version check not possible as the client is not yet ready or did not expose the version');
        }
        // Return true if the server version >= desired_version
        var version = connection.server_info.versions;
        for (var i = 0; i < 3; i++) {
            if (version[i] > desired_version[i]) {
                return true;
            }
            if (version[i] < desired_version[i]) {
                if (this.skip) this.skip();
                return false;
            }
        }
        return true;
    },
    allTests: function (opts, cb) {
        if (!cb) {
            cb = opts;
            opts = {};
        }
        var parsers = ['javascript'];
        var protocols = ['IPv4'];
        if (process.platform !== 'win32') {
            protocols.push('IPv6', '/tmp/redis.sock');
        }
        var options = [{
            detect_buffers: true
        }, {
            detect_buffers: false
        }];
        options.forEach(function (options) {
            var strOptions = '';
            var key;
            for (key in options) {
                if (options.hasOwnProperty(key)) {
                    strOptions += key + ': ' + options[key] + '; ';
                }
            }
            describe('using options: ' + strOptions, function () {
                parsers.forEach(function (parser) {
                    protocols.forEach(function (ip, i) {
                        if (i !== 0 && !opts.allConnections) {
                            return;
                        }
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
        return function (err) {
            if (err) {
                throw err;
            }
            i++;
            if (i >= max) {
                func();
                return true;
            }
            return false;
        };
    },
    killConnection: function (client) {
        // Change the connection option to a non existing one and destroy the stream
        client.connection_options = {
            port: 65535,
            host: '127.0.0.1',
            family: 4
        };
        client.address = '127.0.0.1:65535';
        client.stream.destroy();
    }
};
