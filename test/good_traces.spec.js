'use strict';

var assert = require('assert');
var config = require('./lib/config');
var fork = require('child_process').fork;
var redis = config.redis;

describe('stack traces', function () {

    it('should return good traces with NODE_ENV=development set', function (done) {
        var external = fork('./test/lib/good-traces.js', {
            env: {
                NODE_ENV: 'development'
            }
        });

        var id = setTimeout(function () {
            external.kill();
            done(new Error('Timeout'));
        }, 6000);

        external.on('close', function (code) {
            clearTimeout(id);
            assert.strictEqual(code, 0);
            done();
        });
    });

    it('should return good traces with NODE_DEBUG=redis env set', function (done) {
        var external = fork('./test/lib/good-traces.js', {
            env: {
                NODE_DEBUG: 'redis'
            },
            silent: true
        });

        var id = setTimeout(function () {
            external.kill();
            done(new Error('Timeout'));
        }, 6000);

        external.on('close', function (code) {
            clearTimeout(id);
            assert.strictEqual(code, 0);
            done();
        });
    });

    // This is always going to return good stack traces
    it('should always return good stack traces for rejected offline commands', function (done) {
        var client = redis.createClient({
            enable_offline_queue: false
        });
        client.set('foo', function (err, res) {
            assert(/good_traces.spec.js/.test(err.stack));
            client.quit(done);
        });
    });
});
