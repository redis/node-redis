'use strict';

var assert = require('assert');
var config = require('./lib/config');
var fs = require('fs');
var helper = require('./helper');
var path = require('path');
var redis = config.redis;
var utils = require('../lib/utils');

var tlsOptions = {
    servername: 'redis.js.org',
    rejectUnauthorized: true,
    ca: [ String(fs.readFileSync(path.resolve(__dirname, './conf/redis.js.org.cert'))) ]
};

var tlsPort = 6380;
// Use skip instead of returning to indicate what tests really got skipped
var skip = false;

// Wait until stunnel4 is in the travis whitelist
// Check: https://github.com/travis-ci/apt-package-whitelist/issues/403
// If this is merged, remove the travis env checks
describe.skip('TLS connection tests', function () {

    before(function (done) {
        // Print the warning when the tests run instead of while starting mocha
        if (process.platform === 'win32') {
            skip = true;
            console.warn('\nStunnel tests do not work on windows atm. If you think you can fix that, it would be warmly welcome.\n');
        } else if (process.env.TRAVIS === 'true') {
            skip = true;
            console.warn('\nTravis does not support stunnel right now. Skipping tests.\nCheck: https://github.com/travis-ci/apt-package-whitelist/issues/403\n');
        }
        if (skip) return done();
        helper.stopStunnel(function () {
            helper.startStunnel(done);
        });
    });

    after(function (done) {
        if (skip) return done();
        helper.stopStunnel(done);
    });

    var client;

    afterEach(function () {
        if (skip) return;
        client.end(true);
    });

    describe('on lost connection', function () {
        it.skip('emit an error after max retry timeout and do not try to reconnect afterwards', function (done) {
            if (skip) this.skip();
            var connectTimeout = 500; // in ms
            client = redis.createClient({
                connectTimeout: connectTimeout,
                port: tlsPort,
                tls: tlsOptions
            });
            var time = 0;
            assert.strictEqual(client.address, '127.0.0.1:' + tlsPort);

            client.once('ready', function () {
                helper.killConnection(client);
            });

            client.on('reconnecting', function (params) {
                time += params.delay;
            });

            client.on('error', function (err) {
                if (/Redis connection in broken state: connection timeout.*?exceeded./.test(err.message)) {
                    process.nextTick(function () {
                        assert.strictEqual(time, connectTimeout);
                        assert.strictEqual(client.emittedEnd, true);
                        assert.strictEqual(client.connected, false);
                        assert.strictEqual(client.ready, false);
                        assert.strictEqual(client.closing, true);
                        assert.strictEqual(time, connectTimeout);
                        done();
                    });
                }
            });
        });
    });

    describe('when not connected', function () {

        it('connect with host and port provided in the tls object', function (done) {
            if (skip) this.skip();
            var tls = utils.clone(tlsOptions);
            tls.port = tlsPort;
            tls.host = 'localhost';
            client = redis.createClient({
                connectTimeout: 1000,
                tls: tls
            });

            // verify connection is using TCP, not UNIX socket
            assert.strictEqual(client.connectionOptions.host, 'localhost');
            assert.strictEqual(client.connectionOptions.port, tlsPort);
            assert.strictEqual(client.address, 'localhost:' + tlsPort);
            assert(client.stream.encrypted);

            client.set('foo', 'bar');
            client.get('foo', helper.isString('bar', done));
        });

        it('fails to connect because the cert is not correct', function (done) {
            if (skip) this.skip();
            var faultyCert = utils.clone(tlsOptions);
            faultyCert.ca = [ String(fs.readFileSync(path.resolve(__dirname, './conf/faulty.cert'))) ];
            client = redis.createClient({
                host: 'localhost',
                connectTimeout: 1000,
                port: tlsPort,
                tls: faultyCert
            });
            assert.strictEqual(client.address, 'localhost:' + tlsPort);
            client.on('error', function (err) {
                assert(/DEPTH_ZERO_SELF_SIGNED_CERT/.test(err.code || err.message), err);
                client.end(true);
            });
            client.set('foo', 'bar', function (err, res) {
                done(res);
            });
        });

    });
});
