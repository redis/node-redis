'use strict';

var assert = require('assert');
var config = require('./lib/config');
var helper = require('./helper');
var RedisProcess = require('./lib/redis-process');
var rp;
var path = require('path');
var redis = config.redis;

if (process.platform === 'win32') {
    // TODO: Fix redis process spawn on windows
    return;
}

describe('master slave sync', function () {
    var master = null;
    var slave = null;

    before(function (done) {
        helper.stopRedis(function () {
            helper.startRedis('./conf/password.conf', done);
        });
    });

    before(function (done) {
        if (helper.redisProcess().spawnFailed()) return done();
        master = redis.createClient({
            password: 'porkchopsandwiches'
        });
        var multi = master.multi();
        var i = 0;
        while (i < 1000) {
            i++;
            // Write some data in the redis instance, so there's something to sync
            multi.set('foo' + i, 'bar' + new Array(500).join(Math.random()));
        }
        multi.exec(done);
    });

    it('sync process and no master should delay ready being emitted for slaves', function (done) {
        if (helper.redisProcess().spawnFailed()) this.skip();

        var port = 6381;
        var firstInfo;
        slave = redis.createClient({
            port: port,
            retry_strategy: function (options) {
                // Try to reconnect in very small intervals to catch the master_link_status down before the sync completes
                return 10;
            }
        });

        var tmp = slave.info.bind(slave);
        var i = 0;
        slave.info = function (err, res) {
            i++;
            tmp(err, res);
            if (!firstInfo || Object.keys(firstInfo).length === 0) {
                firstInfo = slave.server_info;
            }
        };

        slave.on('connect', function () {
            assert.strictEqual(i, 0);
        });

        var end = helper.callFuncAfter(done, 2);

        slave.on('ready', function () {
            assert.strictEqual(this.server_info.master_link_status, 'up');
            assert.strictEqual(firstInfo.master_link_status, 'down');
            assert(i > 1);
            this.get('foo300', function (err, res) {
                assert.strictEqual(res.substr(0, 3), 'bar');
                end(err);
            });
        });

        RedisProcess.start(function (err, _rp) {
            rp = _rp;
            end(err);
        }, path.resolve(__dirname, './conf/slave.conf'), port);
    });

    after(function (done) {
        if (helper.redisProcess().spawnFailed()) return done();
        var end = helper.callFuncAfter(done, 3);
        rp.stop(end);
        slave.end(true);
        master.flushdb(function (err) {
            end(err);
            master.end(true);
        });
        helper.stopRedis(function () {
            helper.startRedis('./conf/redis.conf', end);
        });
    });
});
