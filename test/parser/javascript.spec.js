'use strict';

var assert = require('assert');
var Parser = require("../../lib/parser/javascript").Parser;
var config = require("../lib/config");
var redis = config.redis;

describe('javascript parser', function () {
    it('handles multi-bulk reply', function (done) {
        var parser = new Parser(false);
        var reply_count = 0;
        function check_reply(reply) {
            assert.deepEqual(reply, [['a']], "Expecting multi-bulk reply of [['a']]");
            reply_count++;
        }
        parser.send_reply = check_reply;

        parser.execute(new Buffer('*1\r\n*1\r\n$1\r\na\r\n'));

        parser.execute(new Buffer('*1\r\n*1\r'));
        parser.execute(new Buffer('\n$1\r\na\r\n'));

        parser.execute(new Buffer('*1\r\n*1\r\n'));
        parser.execute(new Buffer('$1\r\na\r\n'));

        assert.equal(reply_count, 3, "check reply should have been called three times");
        return done();
    });

    // Activate this if you want to fry your cpu / memory
    describe.skip("test out of memory", function () {
        var args = config.configureClient('javascript', '127.0.0.1');
        var clients = new Array(300).join(" ").split(" ");
        var client;
        beforeEach(function (done) {
            client = redis.createClient.apply(redis.createClient, args);
            client.once("connect", function () {
                client.flushdb(done);
            });
        });

        it('reach limit and wait for further data', function (done) {
            setTimeout(done, 5000);
            clients.forEach(function(entry, a) {
                var max = 0;
                var client = redis.createClient.apply(redis.createClient, args);
                client.on('ready', function() {
                    while (++max < 50) {
                        var item = [];
                        for (var i = 0; i < 100; ++i) {
                            item.push('aaa' + (Math.random() * 1000000 | 0));
                        }
                        client.del('foo' + a);
                        client.lpush('foo' + a, item);
                        client.lrange('foo' + a, 0, 99);
                    }
                });
            });
        });
    });
});
