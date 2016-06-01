'use strict';

var assert = require('assert');
var config = require('./lib/config');
var redisLib = require('../');
var RedisClient = redisLib.RedisClient;
var Command = require('../lib/command');
var helper = require('./helper');
var redis = config.redis;
var client;


describe('buffer commands', function () {
    helper.allTests(function (parser, ip, basicArgs) {
        describe('using ' + parser + ' and ' + ip, function () {
            oneParser(parser, ip, basicArgs);
        });
    });
});


function oneParser(parser, ip, basicArgs) {
    [false].forEach(function (many_inits) {
        describe(many_inits ? 'using many inits' : 'using one init', function () {
            var clientConfig = config.configureClient(parser, ip, {
                return_buffers: false,
                detect_buffers: basicArgs[2].detect_buffers,
            });
            oneMode(clientConfig, many_inits);
        });
    });
}


function oneMode(clientConfig, many_inits) {
    global[many_inits ? 'beforeEach' : 'before'](function (done) {
        createClient(clientConfig, function () {
            client.set('string key 1', 'string value');
            client.hmset('hash key 2', 'key 1', 'val 1', 'key 2', 'val 2');
            done();
        });
    });
    
    describe('get', test_get);
    describe('multi.get', test_multi_get);
    describe('batch.get', test_batch_get);
    describe('select', test_select);
    describe('superGet', test_superGet);
    describe('other test', otherTests);
}


function test_get() {
    describe('returns a string', function () {
        it('when command is not prefixed', function (done) {
            client.get('string key 1', assertString(done));
        });

        it('when using send_command', function (done) {
            client.send_command('get', ['string key 1'], assertString(done));
        });

        it('when using internal_send_command', function (done) {
            client.internal_send_command(new Command('get', ['string key 1'], assertString(done)));
        });
    });

    describe('returns a buffer', function () {
        it('when command is "b_" prefixed', function (done) {
            client.b_get('string key 1', assertBuffer(done));
        });

        it('when using send_command with "b_" prefixed command', function (done) {
            client.send_command('b_get', ['string key 1'], assertBuffer(done));
        });

        it('when using send_command_buf', function (done) {
            client.send_command_buf('get', ['string key 1'], assertBuffer(done));
        });

        it('when using send_command_buf with "b_" prefixed command', function (done) {
            client.send_command_buf('b_get', ['string key 1'], assertBuffer(done));
        });

        it('returns a buffer when using internal_send_command_buf', function (done) {
            client.internal_send_command_buf(new Command('get', ['string key 1'], assertBuffer(done)));
        });
    });

    describe('returns error', function () {
        it('when using internal_send_command with "b_" prefixed command', function (done) {
            client.internal_send_command(new Command('b_get', ['string key 1'], function (err) { done(!err); })); //should be err => done(!err)
        });

        it('when using internal_send_command_buf with "b_" prefixed command', function (done) {
            client.internal_send_command_buf(new Command('b_get', ['string key 1'], function (err) { done(!err); })); //should be err => done(!err)
        });
    });

    describe('works fine', function () {
        it('when using get and b_get at the same time', function (done) {
            var left = 3, decLeft = function () { --left || done(); };
            client.get('string key 1', assertString(decLeft));
            client.b_get('string key 1', assertBuffer(decLeft));
            client.get('string key 1', assertString(decLeft));
        });

        it('when using get and send_command with "b_" prefixed command at the same time', function (done) {
            var left = 3, decLeft = function () { --left || done(); };
            client.get('string key 1', assertString(decLeft));
            client.send_command_buf('b_get', ['string key 1'], assertBuffer(decLeft));
            client.get('string key 1', assertString(decLeft));
        });

        it('when using get and send_command_buf at the same time', function (done) {
            var left = 3, decLeft = function () { --left || done(); };
            client.get('string key 1', assertString(decLeft));
            client.send_command_buf('get', ['string key 1'], assertBuffer(decLeft));
            client.get('string key 1', assertString(decLeft));
        });

        it('when using get and send_command_buf with "b_" prefixed command at the same time', function (done) {
            var left = 3, decLeft = function () { --left || done(); };
            client.get('string key 1', assertString(decLeft));
            client.send_command_buf('get', ['string key 1'], assertBuffer(decLeft));
            client.get('string key 1', assertString(decLeft));
        });

        it('when using send_command and b_get at the same time', function (done) {
            var left = 3, decLeft = function () { --left || done(); };
            client.send_command('get', ['string key 1'], assertString(decLeft));
            client.b_get('string key 1', assertBuffer(decLeft));
            client.send_command('get', ['string key 1'], assertString(decLeft));
        });

        it('when using get and send_command with "b_" prefixed command at the same time', function (done) {
            var left = 3, decLeft = function () { --left || done(); };
            client.send_command('get', ['string key 1'], assertString(decLeft));
            client.send_command_buf('b_get', ['string key 1'], assertBuffer(decLeft));
            client.send_command('get', ['string key 1'], assertString(decLeft));
        });

        it('when using get and send_command_buf at the same time', function (done) {
            var left = 3, decLeft = function () { --left || done(); };
            client.send_command('get', ['string key 1'], assertString(decLeft));
            client.send_command_buf('get', ['string key 1'], assertBuffer(decLeft));
            client.send_command('get', ['string key 1'], assertString(decLeft));
        });

        it('when using get and send_command_buf with "b_" prefixed command at the same time', function (done) {
            var left = 3, decLeft = function () { --left || done(); };
            client.send_command('get', ['string key 1'], assertString(decLeft));
            client.send_command_buf('get', ['string key 1'], assertBuffer(decLeft));
            client.send_command('get', ['string key 1'], assertString(decLeft));
        });
    });
}


function test_multi_get() {
    it('returns strings when get + get', function (done) {
        client.multi().get('string key 1').get('string key 1').exec(function (err, reply) {
            assert.strictEqual(2, reply.length);
            assert.strictEqual('string value', reply[0]);
            assert.strictEqual('string value', reply[1]);
            return done(err);
        });
    });

    it('returns string + buffer when get + b_get', function (done) {
        client.multi().get('string key 1').b_get('string key 1').exec(function (err, reply) {
            assert.strictEqual(2, reply.length);
            assert.strictEqual('string value', reply[0]);
            assert.strictEqual(true, Buffer.isBuffer(reply[1]));
            assert.strictEqual('<Buffer 73 74 72 69 6e 67 20 76 61 6c 75 65>', reply[1].inspect());
            return done(err);
        });
    });

    it('returns buffer + string when b_get + get', function (done) {
        client.multi().b_get('string key 1').get('string key 1').exec(function (err, reply) {
            assert.strictEqual(2, reply.length);
            assert.strictEqual(true, Buffer.isBuffer(reply[0]));
            assert.strictEqual('<Buffer 73 74 72 69 6e 67 20 76 61 6c 75 65>', reply[0].inspect());
            assert.strictEqual('string value', reply[1]);
            return done(err);
        });
    });

    it('returns buffers when b_get + b_get', function (done) {
        client.multi().b_get('string key 1').b_get('string key 1').exec(function (err, reply) {
            assert.strictEqual(2, reply.length);
            assert.strictEqual(true, Buffer.isBuffer(reply[0]));
            assert.strictEqual('<Buffer 73 74 72 69 6e 67 20 76 61 6c 75 65>', reply[0].inspect());
            assert.strictEqual(true, Buffer.isBuffer(reply[1]));
            assert.strictEqual('<Buffer 73 74 72 69 6e 67 20 76 61 6c 75 65>', reply[1].inspect());
            return done(err);
        });
    });
}


function test_batch_get() {
    it('returns strings when get + get', function (done) {
        client.batch().get('string key 1').get('string key 1').exec(function (err, reply) {
            assert.strictEqual(2, reply.length);
            assert.strictEqual('string value', reply[0]);
            assert.strictEqual('string value', reply[1]);
            return done(err);
        });
    });

    it('returns string + buffer when get + b_get', function (done) {
        client.batch().get('string key 1').b_get('string key 1').exec(function (err, reply) {
            assert.strictEqual(2, reply.length);
            assert.strictEqual('string value', reply[0]);
            assert.strictEqual(true, Buffer.isBuffer(reply[1]));
            assert.strictEqual('<Buffer 73 74 72 69 6e 67 20 76 61 6c 75 65>', reply[1].inspect());
            return done(err);
        });
    });

    it('returns buffer + string when b_get + get', function (done) {
        client.batch().b_get('string key 1').get('string key 1').exec(function (err, reply) {
            assert.strictEqual(2, reply.length);
            assert.strictEqual(true, Buffer.isBuffer(reply[0]));
            assert.strictEqual('<Buffer 73 74 72 69 6e 67 20 76 61 6c 75 65>', reply[0].inspect());
            assert.strictEqual('string value', reply[1]);
            return done(err);
        });
    });

    it('returns buffers when b_get + b_get', function (done) {
        client.batch().b_get('string key 1').b_get('string key 1').exec(function (err, reply) {
            assert.strictEqual(2, reply.length);
            assert.strictEqual(true, Buffer.isBuffer(reply[0]));
            assert.strictEqual('<Buffer 73 74 72 69 6e 67 20 76 61 6c 75 65>', reply[0].inspect());
            assert.strictEqual(true, Buffer.isBuffer(reply[1]));
            assert.strictEqual('<Buffer 73 74 72 69 6e 67 20 76 61 6c 75 65>', reply[1].inspect());
            return done(err);
        });
    });
}


function test_select() {
    beforeEach(function (done) {
        client.select(1, function (err, reply) {
            assert.strictEqual(reply, 'OK');
            done(err);
        });
    });

    var assertDb1 = function (done) {
        assert.strictEqual(client.selected_db, 1);
        client.eval('return #redis.call("KEYS", "*");', 0, function (err, reply) {
            if (err) throw err;
            assert.strictEqual(reply, 0);
            done();
        });
    };

    var assertDb0 = function (buf, done) {
        return function (err, reply) {
            if (err) throw err;
            if (buf) {
                assert.strictEqual(true, Buffer.isBuffer(reply));
                assert.strictEqual('<Buffer 4f 4b>', reply.inspect());
            }else{
                assert.strictEqual(reply, 'OK');
            }
            assert.strictEqual(client.selected_db, 0);

            client.eval('return #redis.call("KEYS", "*");', 0, function (err, reply) {
                if (err) throw err;
                assert(typeof(reply) === 'number' && reply > 0);
                done && done();
            });
        };
    };

    it('works with "b_" prefix', function (done) {
        assertDb1(function () {
            client.b_select(0, assertDb0(true, done));
        });
    });

    it('works with send_command', function (done) {
        assertDb1(function () {
            client.send_command('select', [0], assertDb0(false, done));
        });
    });

    it('works with send_command and "b_" prefix', function (done) {
        assertDb1(function () {
            client.send_command('b_select', [0], assertDb0(true, done));
        });
    });

    it('works with send_command_buf', function (done) {
        assertDb1(function () {
            client.send_command_buf('select', [0], assertDb0(true, done));
        });
    });

    it('works with send_command_buf and "b_" prefix', function (done) {
        assertDb1(function () {
            client.send_command_buf('b_select', [0], assertDb0(true, done));
        });
    });

    it('works with multi and "b_" prefix', function (done) {
        assertDb1(function () {
            client.multi().b_select(0, assertDb0(done)).exec(function (err, reply) {
                assert.strictEqual(1, reply.length);
                assert.strictEqual(true, Buffer.isBuffer(reply[0]));
                assert.strictEqual('<Buffer 4f 4b>', reply[0].inspect());
                return done(err);
            });
        });
    });

    it('works with batch and "b_" prefix', function (done) {
        assertDb1(function () {
            client.batch().b_select(0, assertDb0(done)).exec(function (err, reply) {
                assert.strictEqual(1, reply.length);
                assert.strictEqual(true, Buffer.isBuffer(reply[0]));
                assert.strictEqual('<Buffer 4f 4b>', reply[0].inspect());
                return done(err);
            });
        });
    });
}


function test_superGet() {
    before(function () {
        RedisClient.prototype.superGet = function (key, callback) {
            var left = 3, error = null;
            var ans = [];

            this.get(key, decLeft);
            this.send_command('get', [key], decLeft);
            this.internal_send_command(new Command('get', [key], decLeft));

            function decLeft(err, data) {
                if (err) error = err;
                ans.push(data);
                if (--left === 0) callback && callback(error, error ? null : ans);
            }
        };

        redisLib.create_individual_command_buf('superGet');
    });

    var assertStrings = function (done) {
        return function (err, reply) {
            if (err) throw err;
            assert.deepEqual(['string value', 'string value', 'string value'], reply);
            done();
        };
    };

    var assertBuffers = function (done) {
        return function (err, reply) {
            if (err) throw err;
            assert.strictEqual(3, reply.length);
            assert.strictEqual('<Buffer 73 74 72 69 6e 67 20 76 61 6c 75 65>', reply[0].inspect());
            assert.strictEqual('<Buffer 73 74 72 69 6e 67 20 76 61 6c 75 65>', reply[1].inspect());
            assert.strictEqual('<Buffer 73 74 72 69 6e 67 20 76 61 6c 75 65>', reply[2].inspect());
            done();
        };
    };

    describe('returns strings', function () {
        it('when command is not prefixed', function (done) {
            client.superGet('string key 1', assertStrings(done));
        });

        it('when using send_command', function (done) {
            client.send_command('superGet', ['string key 1'], assertStrings(done));
        });
    });

    describe('returns buffers', function () {
        it('when command is "b_" prefixed', function (done) {
            client.b_superGet('string key 1', assertBuffers(done));
        });

        it('when using send_command with "b_" prefixed command', function (done) {
            client.send_command('b_superGet', ['string key 1'], assertBuffers(done));
        });

        it('when using send_command_buf', function (done) {
            client.send_command_buf('superGet', ['string key 1'], assertBuffers(done));
        });

        it('when using send_command_buf with "b_" prefixed command', function (done) {
            client.send_command_buf('b_superGet', ['string key 1'], assertBuffers(done));
        });
    });
}


// Most of these tests are copied from detect_buffers
function otherTests() {
    describe('multi.hget', function () {
        it('returns buffers and one string', function (done) {
            client.multi()
                .b_hget('hash key 2', 'key 1')
                .b_hget('hash key 2', 'key 1')
                .hget('hash key 2', 'key 2')
                .b_hget('hash key 2', 'key 2')
                .exec(function (err, reply) {
                    assert.strictEqual(true, Array.isArray(reply));
                    assert.strictEqual(4, reply.length);
                    assert.strictEqual('<Buffer 76 61 6c 20 31>', reply[0].inspect());
                    assert.strictEqual(true, Buffer.isBuffer(reply[1]));
                    assert.strictEqual('<Buffer 76 61 6c 20 31>', reply[1].inspect());
                    assert.strictEqual('val 2', reply[2]);
                    assert.strictEqual(true, Buffer.isBuffer(reply[3]));
                    assert.strictEqual('<Buffer 76 61 6c 20 32>', reply[3].inspect());
                    return done(err);
                });
        });
    });

    describe('batch.hget', function () {
        it('returns buffers and one string', function (done) {
            client.batch()
                .b_hget('hash key 2', 'key 1')
                .b_hget('hash key 2', 'key 1')
                .hget('hash key 2', 'key 2')
                .b_hget('hash key 2', 'key 2')
                .exec(function (err, reply) {
                    assert.strictEqual(true, Array.isArray(reply));
                    assert.strictEqual(4, reply.length);
                    assert.strictEqual('<Buffer 76 61 6c 20 31>', reply[0].inspect());
                    assert.strictEqual(true, Buffer.isBuffer(reply[1]));
                    assert.strictEqual('<Buffer 76 61 6c 20 31>', reply[1].inspect());
                    assert.strictEqual('val 2', reply[2]);
                    assert.strictEqual(true, Buffer.isBuffer(reply[3]));
                    assert.strictEqual('<Buffer 76 61 6c 20 32>', reply[3].inspect());
                    return done(err);
                });
        });
    });

    describe('hmget', function () {
        describe('using send_command_buf', function () {
            it('returns buffers for keys requested', function (done) {
                client.send_command_buf('hmget', ['hash key 2', 'key 1', 'key 2'], function (err, reply) {
                    assert.strictEqual(true, Array.isArray(reply));
                    assert.strictEqual(2, reply.length);
                    assert.strictEqual(true, Buffer.isBuffer(reply[0]));
                    assert.strictEqual(true, Buffer.isBuffer(reply[1]));
                    assert.strictEqual('<Buffer 76 61 6c 20 31>', reply[0].inspect());
                    assert.strictEqual('<Buffer 76 61 6c 20 32>', reply[1].inspect());
                    return done(err);
                });
            });

            it('returns buffers for keys requested', function (done) {
                client.send_command('b_hmget', ['hash key 2', 'key 1', 'key 2'], function (err, reply) {
                    assert.strictEqual(true, Array.isArray(reply));
                    assert.strictEqual(2, reply.length);
                    assert.strictEqual(true, Buffer.isBuffer(reply[0]));
                    assert.strictEqual(true, Buffer.isBuffer(reply[1]));
                    assert.strictEqual('<Buffer 76 61 6c 20 31>', reply[0].inspect());
                    assert.strictEqual('<Buffer 76 61 6c 20 32>', reply[1].inspect());
                    return done(err);
                });
            });

            it('returns strings for keys requested', function (done) {
                client.send_command('hmget', ['hash key 2', 'key 1', 'key 2'], function (err, reply) {
                    assert.strictEqual(true, Array.isArray(reply));
                    assert.strictEqual(2, reply.length);
                    assert.strictEqual('val 1', reply[0]);
                    assert.strictEqual('val 2', reply[1]);
                    return done(err);
                });
            });
        });

        describe('using b_hmget', function () {
            it('handles array of strings with undefined values in transaction (repro #344)', function (done) {
                client.multi().b_hmget('hash key 2', 'key 3', 'key 4').exec(function (err, reply) {
                    assert.strictEqual(true, Array.isArray(reply));
                    assert.strictEqual(1, reply.length);
                    assert.strictEqual(2, reply[0].length);
                    assert.equal(null, reply[0][0]);
                    assert.equal(null, reply[0][1]);
                    return done(err);
                });
            });

            it('returns buffers for keys requested', function (done) {
                client.b_hmget('hash key 2', 'key 1', 'key 2', function (err, reply) {
                    assert.strictEqual(true, Array.isArray(reply));
                    assert.strictEqual(2, reply.length);
                    assert.strictEqual(true, Buffer.isBuffer(reply[0]));
                    assert.strictEqual(true, Buffer.isBuffer(reply[1]));
                    assert.strictEqual('<Buffer 76 61 6c 20 31>', reply[0].inspect());
                    assert.strictEqual('<Buffer 76 61 6c 20 32>', reply[1].inspect());
                    return done(err);
                });
            });

            it('returns strings for keys requested', function (done) {
                client.hmget('hash key 2', 'key 1', 'key 2', function (err, reply) {
                    assert.strictEqual(true, Array.isArray(reply));
                    assert.strictEqual(2, reply.length);
                    assert.strictEqual('val 1', reply[0]);
                    assert.strictEqual('val 2', reply[1]);
                    return done(err);
                });
            });

            it('returns buffers for keys requested in transaction', function (done) {
                client.multi().b_hmget('hash key 2', 'key 1', 'key 2').exec(function (err, reply) {
                    assert.strictEqual(true, Array.isArray(reply));
                    assert.strictEqual(1, reply.length);
                    assert.strictEqual(2, reply[0].length);
                    assert.strictEqual(true, Buffer.isBuffer(reply[0][0]));
                    assert.strictEqual(true, Buffer.isBuffer(reply[0][1]));
                    assert.strictEqual('<Buffer 76 61 6c 20 31>', reply[0][0].inspect());
                    assert.strictEqual('<Buffer 76 61 6c 20 32>', reply[0][1].inspect());
                    return done(err);
                });
            });

            it('returns buffers for keys requested in .batch', function (done) {
                client.batch().b_hmget('hash key 2', 'key 1', 'key 2').exec(function (err, reply) {
                    assert.strictEqual(true, Array.isArray(reply));
                    assert.strictEqual(1, reply.length);
                    assert.strictEqual(2, reply[0].length);
                    assert.strictEqual(true, Buffer.isBuffer(reply[0][0]));
                    assert.strictEqual(true, Buffer.isBuffer(reply[0][1]));
                    assert.strictEqual('<Buffer 76 61 6c 20 31>', reply[0][0].inspect());
                    assert.strictEqual('<Buffer 76 61 6c 20 32>', reply[0][1].inspect());
                    return done(err);
                });
            });
        });
    });

    describe('hgetall', function (done) {
        describe('using send_command_buf', function (done) {
            it('returns buffer values', function (done) {
                client.send_command_buf('hgetall', ['hash key 2'], function (err, reply) {
                    assert.strictEqual('object', typeof reply);
                    assert.strictEqual(2, Object.keys(reply).length);
                    assert.strictEqual('<Buffer 76 61 6c 20 31>', reply['key 1'].inspect());
                    assert.strictEqual('<Buffer 76 61 6c 20 32>', reply['key 2'].inspect());
                    return done(err);
                });
            });

            it('returns buffer values', function (done) {
                client.send_command('b_hgetall', ['hash key 2'], function (err, reply) {
                    assert.strictEqual('object', typeof reply);
                    assert.strictEqual(2, Object.keys(reply).length);
                    assert.strictEqual('<Buffer 76 61 6c 20 31>', reply['key 1'].inspect());
                    assert.strictEqual('<Buffer 76 61 6c 20 32>', reply['key 2'].inspect());
                    return done(err);
                });
            });
        });

        describe('using b_hgetall', function (done) {
            it('returns buffer values', function (done) {
                client.b_hgetall('hash key 2', function (err, reply) {
                    assert.strictEqual('object', typeof reply);
                    assert.strictEqual(2, Object.keys(reply).length);
                    assert.strictEqual('<Buffer 76 61 6c 20 31>', reply['key 1'].inspect());
                    assert.strictEqual('<Buffer 76 61 6c 20 32>', reply['key 2'].inspect());
                    return done(err);
                });
            });

            it('returns buffer values when executed in transaction', function (done) {
                client.multi().b_hgetall('hash key 2').exec(function (err, reply) {
                    assert.strictEqual(1, reply.length);
                    assert.strictEqual('object', typeof reply[0]);
                    assert.strictEqual(2, Object.keys(reply[0]).length);
                    assert.strictEqual('<Buffer 76 61 6c 20 31>', reply[0]['key 1'].inspect());
                    assert.strictEqual('<Buffer 76 61 6c 20 32>', reply[0]['key 2'].inspect());
                    return done(err);
                });
            });

            it('returns buffer values when executed in .batch', function (done) {
                client.batch().b_hgetall('hash key 2').exec(function (err, reply) {
                    assert.strictEqual(1, reply.length);
                    assert.strictEqual('object', typeof reply[0]);
                    assert.strictEqual(2, Object.keys(reply[0]).length);
                    assert.strictEqual('<Buffer 76 61 6c 20 31>', reply[0]['key 1'].inspect());
                    assert.strictEqual('<Buffer 76 61 6c 20 32>', reply[0]['key 2'].inspect());
                    return done(err);
                });
            });
        });
    });
}


//=== functions ===


function assertString(done) {
    return function (err, reply) {
        if (err) throw err;
        assert.strictEqual('string value', reply);
        done();
    };
};


function assertBuffer(done) {
    return function (err, reply) {
        if (err) throw err;
        assert.strictEqual(true, Buffer.isBuffer(reply));
        assert.strictEqual('<Buffer 73 74 72 69 6e 67 20 76 61 6c 75 65>', reply.inspect());
        done();
    };
};


function createClient(clientConfig, callback) {
    client = redis.createClient.apply(null, clientConfig);
    client.once('error', function (err) {
        throw err;
    });
    client.once('connect', function () {
        client.flushdb(function (err) {
            if (err) throw err;
            callback();
        });
    });
}
