'use strict';

var assert = require('assert');
var config = require('./lib/config');
var fs = require('fs');
var helper = require('./helper');
var path = require('path');
var redis = config.redis;
var utils = require('../lib/utils');

var tls_options = {
    servername: 'redis.js.org',
    rejectUnauthorized: true,
    ca: [ String(fs.readFileSync(path.resolve(__dirname, './conf/redis.js.org.cert'))) ]
};

var tls_port = 6380;
// Use skip instead of returning to indicate what tests really got skipped
var skip = false;

// Wait until stunnel4 is in the travis whitelist
// Check: https://github.com/travis-ci/apt-package-whitelist/issues/403
// If this is merged, remove the travis env checks
describe('TLS connection tests', function () {

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
        it('emit an error after max retry timeout and do not try to reconnect afterwards', function (done) {
            if (skip) this.skip();
            var connect_timeout = 500; // in ms
            client = redis.createClient({
                connect_timeout: connect_timeout,
                port: tls_port,
                tls: tls_options
            });
            var time = 0;

            client.once('ready', function () {
                helper.killConnection(client);
            });

            client.on('reconnecting', function (params) {
                time += params.delay;
            });

            client.on('error', function (err) {
                if (/Redis connection in broken state: connection timeout.*?exceeded./.test(err.message)) {
                    setTimeout(function () {
                        assert(time === connect_timeout);
                        done();
                    }, 100);
                }
            });
        });
    });

    describe('when not connected', function () {

        it('connect with host and port provided in the options object', function (done) {
            if (skip) this.skip();
            client = redis.createClient({
                host: 'localhost',
                connect_timeout: 1000,
                port: tls_port,
                tls: tls_options
            });

            // verify connection is using TCP, not UNIX socket
            assert.strictEqual(client.connection_options.host, 'localhost');
            assert.strictEqual(client.connection_options.port, tls_port);
            assert(client.stream.encrypted);

            client.set('foo', 'bar');
            client.get('foo', helper.isString('bar', done));
        });

        it('fails to connect because the cert is not correct', function (done) {
            if (skip) this.skip();
            var faulty_cert = utils.clone(tls_options);
            faulty_cert.ca = [ String(fs.readFileSync(path.resolve(__dirname, './conf/faulty.cert'))) ];
            client = redis.createClient({
                host: 'localhost',
                connect_timeout: 1000,
                port: tls_port,
                tls: faulty_cert
            });
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
