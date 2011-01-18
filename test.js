/*global require console setTimeout process Buffer */
var redis = require("./index"),
    client = redis.createClient(6379, "127.0.0.1", {
        parser: "javascript"
    }),
    client2 = redis.createClient(),
    client3 = redis.createClient(),
    assert = require("assert"),
    util = require("./lib/util").util,
    test_db_num = 15, // this DB will be flushed and used for testing
    tests = {},
    connected = false,
    ended = false,
    server_info;

// Uncomment this to see the wire protocol and other debugging info
redis.debug_mode = false;

function buffers_to_strings(arr) {
    return arr.map(function (val) {
        return val.toString();
    });
}

function require_number(expected, label) {
    return function (err, results) {
        assert.strictEqual(null, err, "result sent back unexpected error: " + err);
        assert.strictEqual(expected, results, label + " " + expected + " !== " + results);
        assert.strictEqual(typeof results, "number", label);
        return true;
    };
}

function require_number_any(label) {
    return function (err, results) {
        assert.strictEqual(null, err, "result sent back unexpected error: " + err);
        assert.strictEqual(typeof results, "number", label + " " + results + " is not a number");
        return true;
    };
}

function require_number_pos(label) {
    return function (err, results) {
        assert.strictEqual(null, err, "result sent back unexpected error: " + err);
        assert.strictEqual(true, (results > 0), label + " " + results + " is not a positive number");
        return true;
    };
}

function require_string(str, label) {
    return function (err, results) {
        assert.strictEqual(null, err, "result sent back unexpected error: " + err);
        assert.equal(str, results, label + " " + str + " does not match " + results);
        return true;
    };
}

function require_null(label) {
    return function (err, results) {
        assert.strictEqual(null, err, "result sent back unexpected error: " + err);
        assert.strictEqual(null, results, label + ": " + results + " is not null");
        return true;
    };
}

function require_error(label) {
    return function (err, results) {
        assert.notEqual(err, null, label + " err is null, but an error is expected here.");
        return true;
    };
}

function is_empty_array(obj) { 
    return Array.isArray(obj) && obj.length === 0;
}

function last(name, fn) {
    return function (err, results) {
        fn(err, results);
        next(name);
    };
}

function next(name) {
    console.log(" \x1b[33m" + (Date.now() - cur_start) + "\x1b[0m ms");
    run_next_test();
}

// Tests are run in the order they are defined.  So FLUSHDB should be stay first.

tests.FLUSHDB = function () {
    var name = "FLUSHDB";
    client.select(test_db_num, require_string("OK", name));
    client2.select(test_db_num, require_string("OK", name));
    client3.select(test_db_num, require_string("OK", name));
    client.mset("flush keys 1", "flush val 1", "flush keys 2", "flush val 2", require_string("OK", name));
    client.FLUSHDB(require_string("OK", name));
    client.dbsize(last(name, require_number(0, name)));
};

tests.MULTI_1 = function () {
    var name = "MULTI_1", multi1, multi2;

    // Provoke an error at queue time
    multi1 = client.multi();
    multi1.mset("multifoo", "10", "multibar", "20", require_string("OK", name));
    multi1.set("foo2", require_error(name));
    multi1.incr("multifoo", require_number(11, name));
    multi1.incr("multibar", require_number(21, name));
    multi1.exec();

    // Confirm that the previous command, while containing an error, still worked.
    multi2 = client.multi();
    multi2.incr("multibar", require_number(22, name));
    multi2.incr("multifoo", require_number(12, name));
    multi2.exec(function (err, replies) {
        assert.strictEqual(22, replies[0]);
        assert.strictEqual(12, replies[1]);
        next(name);
    });
};

tests.MULTI_2 = function () {
    var name = "MULTI_2";

    // test nested multi-bulk replies
    client.multi([
        ["mget", "multifoo", "multibar", function (err, res) {
            assert.strictEqual(2, res.length, name);
            assert.strictEqual("12", res[0].toString(), name);
            assert.strictEqual("22", res[1].toString(), name);
        }],
        ["set", "foo2", require_error(name)],
        ["incr", "multifoo", require_number(13, name)],
        ["incr", "multibar", require_number(23, name)]
    ]).exec(function (err, replies) {
        assert.strictEqual(2, replies[0].length, name);
        assert.strictEqual("12", replies[0][0].toString(), name);
        assert.strictEqual("22", replies[0][1].toString(), name);

        assert.strictEqual("13", replies[1].toString());
        assert.strictEqual("23", replies[2].toString());
        next(name);
    });
};

tests.MULTI_3 = function () {
    var name = "MULTI_3";

    client.sadd("some set", "mem 1");
    client.sadd("some set", "mem 2");
    client.sadd("some set", "mem 3");
    client.sadd("some set", "mem 4");

    // make sure empty mb reply works
    client.del("some missing set");
    client.smembers("some missing set", function (err, reply) {
        // make sure empty mb reply works
        assert.strictEqual(true, is_empty_array(reply), name);
    });
 
    // test nested multi-bulk replies with empty mb elements.
    client.multi([
        ["smembers", "some set"],
        ["del", "some set"],
        ["smembers", "some set"]
    ])
    .scard("some set")
    .exec(function (err, replies) {
        assert.strictEqual(true, is_empty_array(replies[2]), name);
        next(name);
    });
};

tests.MULTI_4 = function () {
    var name = "MULTI_4";

    client.multi()
        .mset('some', '10', 'keys', '20')
        .incr('some')
        .incr('keys')
        .mget('some', 'keys')
        .exec(function (err, replies) {
            assert.strictEqual(null, err);
            assert.equal('OK', replies[0]);
            assert.equal(11, replies[1]);
            assert.equal(21, replies[2]);
            assert.equal(11, replies[3][0].toString());
            assert.equal(21, replies[3][1].toString());
            next(name);
        });
};

tests.MULTI_5 = function () {
    var name = "MULTI_5";

    // test nested multi-bulk replies with nulls.
    client.multi([
        ["mget", ["multifoo", "some", "random value", "keys"]],
        ["incr", "multifoo"]
    ])
    .exec(function (err, replies) {
        assert.strictEqual(replies.length, 2, name);
        assert.strictEqual(replies[0].length, 4, name);
        next(name);
    });
};

tests.MULTI_6 = function () {
    var name = "MULTI_6";

    client.multi()
        .hmset("multihash", "a", "foo", "b", 1)
        .hmset("multihash", {
            extra: "fancy",
            things: "here"
        })
        .hgetall("multihash")
        .exec(function (err, replies) {
            assert.strictEqual(null, err);
            assert.equal("OK", replies[0]);
            assert.equal(Object.keys(replies[2]).length, 4);
            assert.equal("foo", replies[2].a);
            assert.equal("1", replies[2].b);
            assert.equal("fancy", replies[2].extra);
            assert.equal("here", replies[2].things);
            next(name);
        });
};

tests.WATCH_MULTI = function () {
  var name = 'WATCH_MULTI';

  if (server_info.versions[0] >= 2 && server_info.versions[1] >= 1) {
      client.watch(name);
      client.incr(name);
      var multi = client.multi();
      multi.incr(name);
      multi.exec(last(name, require_null(name)));
  } else {
      console.log("Skipping " + name + " because server version isn't new enough.");
      next(name);
  }
};

tests.reconnect = function () {
    var name = "reconnect";

    client.set("recon 1", "one");
    client.set("recon 2", "two", function (err, res) {
        // Do not do this in normal programs. This is to simulate the server closing on us.
        // For orderly shutdown in normal programs, do client.quit()
        client.stream.destroy();
    });
    
    client.on("reconnecting", function on_recon(params) {
        client.on("connect", function on_connect() {
            client.select(test_db_num, require_string("OK", name));
            client.get("recon 1", require_string("one", name));
            client.get("recon 1", require_string("one", name));
            client.get("recon 2", require_string("two", name));
            client.get("recon 2", require_string("two", name));
            client.removeListener("connect", on_connect);
            client.removeListener("reconnecting", on_recon);
            next(name);
        });
    });
};

tests.HSET = function () {
    var key = "test hash",
        field1 = new Buffer("0123456789"),
        value1 = new Buffer("abcdefghij"),
        field2 = new Buffer(0),
        value2 = new Buffer(0),
        name = "HSET";

    client.HSET(key, field1, value1, require_number(1, name));
    client.HGET(key, field1, require_string(value1.toString(), name));

    // Empty value
    client.HSET(key, field1, value2, require_number(0, name));
    client.HGET([key, field1], require_string("", name));

    // Empty key, empty value
    client.HSET([key, field2, value1], require_number(1, name));
    client.HSET(key, field2, value2, last(name, require_number(0, name)));
};


tests.HMGET = function () {
    var key1 = "test hash 1", key2 = "test hash 2", name = "HMGET";

    // redis-like hmset syntax
    client.HMSET(key1, "0123456789", "abcdefghij", "some manner of key", "a type of value", require_string("OK", name));

    // fancy hmset syntax
    client.HMSET(key2, {
        "0123456789": "abcdefghij",
        "some manner of key": "a type of value"
    }, require_string("OK", name));

    client.HMGET(key1, "0123456789", "some manner of key", function (err, reply) {
        assert.strictEqual("abcdefghij", reply[0].toString(), name);
        assert.strictEqual("a type of value", reply[1].toString(), name);
    });

    client.HMGET(key2, "0123456789", "some manner of key", function (err, reply) {
        assert.strictEqual("abcdefghij", reply[0].toString(), name);
        assert.strictEqual("a type of value", reply[1].toString(), name);
    });
    
    client.HMGET(key1, "missing thing", "another missing thing", function (err, reply) {
        assert.strictEqual(null, reply[0], name);
        assert.strictEqual(null, reply[1], name);
        next(name);
    });
};

tests.HINCRBY = function () {
    var name = "HINCRBY";
    client.hset("hash incr", "value", 10, require_number(1, name));
    client.HINCRBY("hash incr", "value", 1, require_number(11, name));
    client.HINCRBY("hash incr", "value 2", 1, last(name, require_number(1, name)));
};

tests.SUBSCRIBE = function () {
    var client1 = client, msg_count = 0, name = "SUBSCRIBE";

    client1.on("subscribe", function (channel, count) {
        if (channel === "chan1") {
            client2.publish("chan1", "message 1", require_number(1, name));
            client2.publish("chan2", "message 2", require_number(1, name));
            client2.publish("chan1", "message 3", require_number(1, name));
        }
    });

    client1.on("unsubscribe", function (channel, count) {
        if (count === 0) {
            // make sure this connection can go into and out of pub/sub mode
            client1.incr("did a thing", last(name, require_number(2, name)));
        }
    });

    client1.on("message", function (channel, message) {
        msg_count += 1;
        assert.strictEqual("message " + msg_count, message.toString());
        if (msg_count === 3) {
            client1.unsubscribe("chan1", "chan2");
        }
    });

    client1.set("did a thing", 1, require_string("OK", name));
    client1.subscribe("chan1", "chan2");
};

tests.SUBSCRIBE_QUIT = function () {
    var name = "SUBSCRIBE_QUIT";
    client3.on("end", function () {
        next(name);
    });
    client3.on("subscribe", function (channel, count) {
        client3.quit();
    });
    client3.subscribe("chan3");
};

tests.EXISTS = function () {
    var name = "EXISTS";
    client.del("foo", "foo2", require_number_any(name));
    client.set("foo", "bar", require_string("OK", name));
    client.EXISTS("foo", require_number(1, name));
    client.EXISTS("foo2", last(name, require_number(0, name)));
};

tests.DEL = function () {
    var name = "DEL";
    client.DEL("delkey", require_number_any(name));
    client.set("delkey", "delvalue", require_string("OK", name));
    client.DEL("delkey", require_number(1, name));
    client.exists("delkey", require_number(0, name));
    client.DEL("delkey", require_number(0, name));
    client.mset("delkey", "delvalue", "delkey2", "delvalue2", require_string("OK", name));
    client.DEL("delkey", "delkey2", last(name, require_number(2, name)));
};

tests.TYPE = function () {
    var name = "TYPE";
    client.set(["string key", "should be a string"], require_string("OK", name));
    client.rpush(["list key", "should be a list"], require_number_pos(name));
    client.sadd(["set key", "should be a set"], require_number_any(name));
    client.zadd(["zset key", "10.0", "should be a zset"], require_number_any(name));
    client.hset(["hash key", "hashtest", "should be a hash"], require_number_any(0, name));
    
    client.TYPE(["string key"], require_string("string", name));
    client.TYPE(["list key"], require_string("list", name));
    client.TYPE(["set key"], require_string("set", name));
    client.TYPE(["zset key"], require_string("zset", name));
    client.TYPE("not here yet", require_string("none", name));
    client.TYPE(["hash key"], last(name, require_string("hash", name)));
};

tests.KEYS = function () {
    var name = "KEYS";
    client.mset(["test keys 1", "test val 1", "test keys 2", "test val 2"], require_string("OK", name));
    client.KEYS(["test keys*"], function (err, results) {
        assert.strictEqual(null, err, "result sent back unexpected error: " + err);
        assert.strictEqual(2, results.length, name);
        assert.strictEqual("test keys 1", results[0].toString(), name);
        assert.strictEqual("test keys 2", results[1].toString(), name);
        next(name);
    });
};

tests.MULTIBULK_ZERO_LENGTH = function () {
    var name = "MULTIBULK_ZERO_LENGTH";
    client.KEYS(['users:*'], function (err, results) {
        assert.strictEqual(null, err, 'error on empty multibulk reply');
        assert.strictEqual(true, is_empty_array(results), "not an empty array");
        next(name);
    });
};

tests.RANDOMKEY = function () {
    var name = "RANDOMKEY";
    client.mset(["test keys 1", "test val 1", "test keys 2", "test val 2"], require_string("OK", name));
    client.RANDOMKEY([], function (err, results) {
        assert.strictEqual(null, err, name + " result sent back unexpected error: " + err);
        assert.strictEqual(true, /\w+/.test(results), name);
        next(name);
    });
};

tests.RENAME = function () {
    var name = "RENAME";
    client.set(['foo', 'bar'], require_string("OK", name));
    client.RENAME(["foo", "new foo"], require_string("OK", name));
    client.exists(["foo"], require_number(0, name));
    client.exists(["new foo"], last(name, require_number(1, name)));
};

tests.RENAMENX = function () {
    var name = "RENAMENX";
    client.set(['foo', 'bar'], require_string("OK", name));
    client.set(['foo2', 'bar2'], require_string("OK", name));
    client.RENAMENX(["foo", "foo2"], require_number(0, name));
    client.exists(["foo"], require_number(1, name));
    client.exists(["foo2"], require_number(1, name));
    client.del(["foo2"], require_number(1, name));
    client.RENAMENX(["foo", "foo2"], require_number(1, name));
    client.exists(["foo"], require_number(0, name));
    client.exists(["foo2"], last(name, require_number(1, name)));
};

tests.DBSIZE = function () {
    var name = "DBSIZE";
    client.set(['foo', 'bar'], require_string("OK", name));
    client.DBSIZE([], last(name, require_number_pos("DBSIZE")));
};

tests.GET = function () {
    var name = "GET";
    client.set(["get key", "get val"], require_string("OK", name));
    client.GET(["get key"], last(name, require_string("get val", name)));
};

tests.SET = function () {
    var name = "SET";
    client.SET(["set key", "set val"], require_string("OK", name));
    client.get(["set key"], last(name, require_string("set val", name)));
};

tests.GETSET = function () {
    var name = "GETSET";
    client.set(["getset key", "getset val"], require_string("OK", name));
    client.GETSET(["getset key", "new getset val"], require_string("getset val", name));
    client.get(["getset key"], last(name, require_string("new getset val", name)));
};

tests.MGET = function () {
    var name = "MGET";
    client.mset(["mget keys 1", "mget val 1", "mget keys 2", "mget val 2", "mget keys 3", "mget val 3"], require_string("OK", name));
    client.MGET(["mget keys 1", "mget keys 2", "mget keys 3"], function (err, results) {
        assert.strictEqual(null, err, "result sent back unexpected error: " + err);
        assert.strictEqual(3, results.length, name);
        assert.strictEqual("mget val 1", results[0].toString(), name);
        assert.strictEqual("mget val 2", results[1].toString(), name);
        assert.strictEqual("mget val 3", results[2].toString(), name);
    });
    client.MGET(["mget keys 1", "some random shit", "mget keys 2", "mget keys 3"], function (err, results) {
        assert.strictEqual(null, err, "result sent back unexpected error: " + err);
        assert.strictEqual(4, results.length, name);
        assert.strictEqual("mget val 1", results[0].toString(), name);
        assert.strictEqual(null, results[1], name);
        assert.strictEqual("mget val 2", results[2].toString(), name);
        assert.strictEqual("mget val 3", results[3].toString(), name);
        next(name);
    });
};

tests.SETNX = function () {
    var name = "SETNX";
    client.set(["setnx key", "setnx value"], require_string("OK", name));
    client.SETNX(["setnx key", "new setnx value"], require_number(0, name));
    client.del(["setnx key"], require_number(1, name));
    client.exists(["setnx key"], require_number(0, name));
    client.SETNX(["setnx key", "new setnx value"], require_number(1, name));
    client.exists(["setnx key"], last(name, require_number(1, name)));
};

tests.SETEX = function () {
    var name = "SETEX";
    client.SETEX(["setex key", "100", "setex val"], require_string("OK", name));
    client.exists(["setex key"], require_number(1, name));
    client.ttl(["setex key"], last(name, require_number_pos(name)));
};

tests.MSETNX = function () {
    var name = "MSETNX";
    client.mset(["mset1", "val1", "mset2", "val2", "mset3", "val3"], require_string("OK", name));
    client.MSETNX(["mset3", "val3", "mset4", "val4"], require_number(0, name));
    client.del(["mset3"], require_number(1, name));
    client.MSETNX(["mset3", "val3", "mset4", "val4"], require_number(1, name));
    client.exists(["mset3"], require_number(1, name));
    client.exists(["mset4"], last(name, require_number(1, name)));
};

tests.HGETALL = function () {
    var name = "HGETALL";
    client.hmset(["hosts", "mjr", "1", "another", "23", "home", "1234"], require_string("OK", name));
    client.HGETALL(["hosts"], function (err, obj) {
        assert.strictEqual(null, err, name + " result sent back unexpected error: " + err);
        assert.strictEqual(3, Object.keys(obj).length, name);
//        assert.ok(Buffer.isBuffer(obj.mjr), name);
        assert.strictEqual("1", obj.mjr.toString(), name);
        assert.strictEqual("23", obj.another.toString(), name);
        assert.strictEqual("1234", obj.home.toString(), name);
        next(name);
    });
};

tests.HGETALL_NULL = function () {
    var name = "HGETALL_NULL";

    client.hgetall('missing', function (err, obj) {
        assert.strictEqual(null, err);
        assert.deepEqual([], obj);
        next(name);
    });
};

tests.UTF8 = function () {
    var name = "UTF8", 
        utf8_sample = "ಠ_ಠ";

    client.set(["utf8test", utf8_sample], require_string("OK", name));
    client.get(["utf8test"], function (err, obj) {
        assert.strictEqual(null, err);
        assert.strictEqual(utf8_sample, obj);
        next(name);
    });
};

// Set tests were adapted from Brian Hammond's redis-node-client.js, which has a comprehensive test suite

tests.SADD = function () {
    var name = "SADD";
    
    client.del('set0');
    client.sadd('set0', 'member0', require_number(1, name));
    client.sadd('set0', 'member0', last(name, require_number(0, name)));
};

tests.SISMEMBER = function () {
    var name = "SISMEMBER";
    
    client.del('set0');
    client.sadd('set0', 'member0', require_number(1, name));
    client.sismember('set0', 'member0', require_number(1, name));
    client.sismember('set0', 'member1', last(name, require_number(0, name)));
};

tests.SCARD = function () {
    var name = "SCARD";
    
    client.del('set0');
    client.sadd('set0', 'member0', require_number(1, name));
    client.scard('set0', require_number(1, name));
    client.sadd('set0', 'member1', require_number(1, name));
    client.scard('set0', last(name, require_number(2, name)));
};

tests.SREM = function () {
    var name = "SREM";

    client.del('set0');
    client.sadd('set0', 'member0', require_number(1, name));
    client.srem('set0', 'foobar', require_number(0, name))
    client.srem('set0', 'member0', require_number(1, name))
    client.scard('set0', last(name, require_number(0, name)));
};

tests.SPOP = function () {
    var name = "SPOP";
    
    client.del('zzz');
    client.sadd('zzz', 'member0', require_number(1, name));
    client.scard('zzz', require_number(1, name));

    client.spop('zzz', function (err, value) {
        if (err) {
            assert.fail(err);
        }
        assert.equal(value, 'member0', name);
    });

    client.scard('zzz', last(name, require_number(0, name)));
};

tests.SDIFF = function () {
    var name = "SDIFF";
    
    client.del('foo');
    client.sadd('foo', 'x', require_number(1, name));
    client.sadd('foo', 'a', require_number(1, name));
    client.sadd('foo', 'b', require_number(1, name));
    client.sadd('foo', 'c', require_number(1, name));

    client.sadd('bar', 'c', require_number(1, name));

    client.sadd('baz', 'a', require_number(1, name));
    client.sadd('baz', 'd', require_number(1, name));

    client.sdiff('foo', 'bar', 'baz', function (err, values) {
        if (err) {
            assert.fail(err, name);
        }
        values.sort();
        assert.equal(values.length, 2, name);
        assert.equal(values[0], 'b', name);
        assert.equal(values[1], 'x', name);
        next(name);
    });
};

tests.SDIFFSTORE = function () {
    var name = "SDIFFSTORE";
    
    client.del('foo');
    client.del('bar');
    client.del('baz');
    client.del('quux');

    client.sadd('foo', 'x', require_number(1, name))
    client.sadd('foo', 'a', require_number(1, name))
    client.sadd('foo', 'b', require_number(1, name))
    client.sadd('foo', 'c', require_number(1, name))

    client.sadd('bar', 'c', require_number(1, name))

    client.sadd('baz', 'a', require_number(1, name))
    client.sadd('baz', 'd', require_number(1, name))

    // NB: SDIFFSTORE returns the number of elements in the dstkey 

    client.sdiffstore('quux', 'foo', 'bar', 'baz', require_number(2, name))

    client.smembers('quux', function (err, values) {
        if (err) {
            assert.fail(err, name);
        }
        var members = buffers_to_strings(values).sort();

        assert.deepEqual(members, [ 'b', 'x' ], name);
        next(name);
    });
};

tests.SMEMBERS = function () {
    name = "SMEMBERS";
    
    client.del('foo');
    client.sadd('foo', 'x', require_number(1, name));

    client.smembers('foo', function (err, members) {
        if (err) {
            assert.fail(err, name);
        }
        assert.deepEqual(buffers_to_strings(members), [ 'x' ], name);
    });

    client.sadd('foo', 'y', require_number(1, name));

    client.smembers('foo', function (err, values) {
        if (err) {
            assert.fail(err, name);
        }
        assert.equal(values.length, 2, name);
        var members = buffers_to_strings(values).sort();

        assert.deepEqual(members, [ 'x', 'y' ], name);
        next(name);
    });
};

tests.SMOVE = function () {
    var name = "SMOVE";

    client.del('foo');
    client.del('bar');

    client.sadd('foo', 'x', require_number(1, name));
    client.smove('foo', 'bar', 'x', require_number(1, name));
    client.sismember('foo', 'x', require_number(0, name));
    client.sismember('bar', 'x', require_number(1, name));
    client.smove('foo', 'bar', 'x', last(name, require_number(0, name)));
}

tests.SINTER = function () {
    var name = "SINTER";

    client.del('sa');
    client.del('sb');
    client.del('sc');
    
    client.sadd('sa', 'a', require_number(1, name));
    client.sadd('sa', 'b', require_number(1, name));
    client.sadd('sa', 'c', require_number(1, name));

    client.sadd('sb', 'b', require_number(1, name));
    client.sadd('sb', 'c', require_number(1, name));
    client.sadd('sb', 'd', require_number(1, name));

    client.sadd('sc', 'c', require_number(1, name));
    client.sadd('sc', 'd', require_number(1, name));
    client.sadd('sc', 'e', require_number(1, name));

    client.sinter('sa', 'sb', function (err, intersection) {
        if (err) {
            assert.fail(err, name);
        }
        assert.equal(intersection.length, 2, name);
        assert.deepEqual(buffers_to_strings(intersection).sort(), [ 'b', 'c' ], name);
    });

    client.sinter('sb', 'sc', function (err, intersection) {
        if (err) {
            assert.fail(err, name);
        }
        assert.equal(intersection.length, 2, name);
        assert.deepEqual(buffers_to_strings(intersection).sort(), [ 'c', 'd' ], name);
    });

    client.sinter('sa', 'sc', function (err, intersection) {
        if (err) {
            assert.fail(err, name);
        }
        assert.equal(intersection.length, 1, name);
        assert.equal(intersection[0], 'c', name);
    });

    // 3-way

    client.sinter('sa', 'sb', 'sc', function (err, intersection) {
        if (err) {
            assert.fail(err, name);
        }
        assert.equal(intersection.length, 1, name);
        assert.equal(intersection[0], 'c', name);
        next(name);
    });
};

tests.SINTERSTORE = function () {
    var name = "SINTERSTORE";

    client.del('sa');
    client.del('sb');
    client.del('sc');
    client.del('foo');

    client.sadd('sa', 'a', require_number(1, name));
    client.sadd('sa', 'b', require_number(1, name));
    client.sadd('sa', 'c', require_number(1, name));

    client.sadd('sb', 'b', require_number(1, name));
    client.sadd('sb', 'c', require_number(1, name));
    client.sadd('sb', 'd', require_number(1, name));

    client.sadd('sc', 'c', require_number(1, name));
    client.sadd('sc', 'd', require_number(1, name));
    client.sadd('sc', 'e', require_number(1, name));

    client.sinterstore('foo', 'sa', 'sb', 'sc', require_number(1, name))

    client.smembers('foo', function (err, members) {
        if (err) {
            assert.fail(err, name);
        }
        assert.deepEqual(buffers_to_strings(members), [ 'c' ], name);
        next(name);
    });
};

tests.SUNION = function () {
    var name = "SUNION";
    
    client.del('sa');
    client.del('sb');
    client.del('sc');
    
    client.sadd('sa', 'a', require_number(1, name));
    client.sadd('sa', 'b', require_number(1, name));
    client.sadd('sa', 'c', require_number(1, name));

    client.sadd('sb', 'b', require_number(1, name));
    client.sadd('sb', 'c', require_number(1, name));
    client.sadd('sb', 'd', require_number(1, name));

    client.sadd('sc', 'c', require_number(1, name));
    client.sadd('sc', 'd', require_number(1, name));
    client.sadd('sc', 'e', require_number(1, name));

    client.sunion('sa', 'sb', 'sc', function (err, union) {
        if (err) {
            assert.fail(err, name);
        }
        assert.deepEqual(buffers_to_strings(union).sort(), ['a', 'b', 'c', 'd', 'e'], name);
        next(name);
    });
};

tests.SUNIONSTORE = function () {
    var name = "SUNIONSTORE";
    
    client.del('sa');
    client.del('sb');
    client.del('sc');
    client.del('foo');
    
    client.sadd('sa', 'a', require_number(1, name));
    client.sadd('sa', 'b', require_number(1, name));
    client.sadd('sa', 'c', require_number(1, name));

    client.sadd('sb', 'b', require_number(1, name));
    client.sadd('sb', 'c', require_number(1, name));
    client.sadd('sb', 'd', require_number(1, name));

    client.sadd('sc', 'c', require_number(1, name));
    client.sadd('sc', 'd', require_number(1, name));
    client.sadd('sc', 'e', require_number(1, name));

    client.sunionstore('foo', 'sa', 'sb', 'sc', function (err, cardinality) {
        if (err) {
            assert.fail(err, name);
        }
        assert.equal(cardinality, 5, name);
    });

    client.smembers('foo', function (err, members) {
        if (err) {
            assert.fail(err, name);
        }
        assert.equal(members.length, 5, name);
        assert.deepEqual(buffers_to_strings(members).sort(), ['a', 'b', 'c', 'd', 'e'], name);
        next(name);
    });
}

// SORT test adapted from Brian Hammond's redis-node-client.js, which has a comprehensive test suite

tests.SORT = function () {
    var name = "SORT";

    client.del('y');
    client.del('x');
    
    client.rpush('y', 'd', require_number(1, name));
    client.rpush('y', 'b', require_number(2, name));
    client.rpush('y', 'a', require_number(3, name));
    client.rpush('y', 'c', require_number(4, name));

    client.rpush('x', '3', require_number(1, name));
    client.rpush('x', '9', require_number(2, name));
    client.rpush('x', '2', require_number(3, name));
    client.rpush('x', '4', require_number(4, name));

    client.set('w3', '4', require_string("OK", name));
    client.set('w9', '5', require_string("OK", name));
    client.set('w2', '12', require_string("OK", name));
    client.set('w4', '6', require_string("OK", name));

    client.set('o2', 'buz', require_string("OK", name));
    client.set('o3', 'foo', require_string("OK", name));
    client.set('o4', 'baz', require_string("OK", name));
    client.set('o9', 'bar', require_string("OK", name));

    client.set('p2', 'qux', require_string("OK", name));
    client.set('p3', 'bux', require_string("OK", name));
    client.set('p4', 'lux', require_string("OK", name));
    client.set('p9', 'tux', require_string("OK", name));

    // Now the data has been setup, we can test.

    // But first, test basic sorting.

    // y = [ d b a c ]
    // sort y ascending = [ a b c d ]
    // sort y descending = [ d c b a ]

    client.sort('y', 'asc', 'alpha', function (err, sorted) {
        if (err) {
            assert.fail(err, name);
        }
        assert.deepEqual(buffers_to_strings(sorted), ['a', 'b', 'c', 'd'], name);
    });

    client.sort('y', 'desc', 'alpha', function (err, sorted) {
        if (err) {
            assert.fail(err, name);
        }
        assert.deepEqual(buffers_to_strings(sorted), ['d', 'c', 'b', 'a'], name);
    });

    // Now try sorting numbers in a list.
    // x = [ 3, 9, 2, 4 ]

    client.sort('x', 'asc', function (err, sorted) {
        if (err) {
            assert.fail(err, name);
        }
        assert.deepEqual(buffers_to_strings(sorted), [2, 3, 4, 9], name);
    });

    client.sort('x', 'desc', function (err, sorted) {
        if (err) {
            assert.fail(err, name);
        }
        assert.deepEqual(buffers_to_strings(sorted), [9, 4, 3, 2], name);
    });

    // Try sorting with a 'by' pattern.

    client.sort('x', 'by', 'w*', 'asc', function (err, sorted) {
        if (err) {
            assert.fail(err, name);
        }
        assert.deepEqual(buffers_to_strings(sorted), [3, 9, 4, 2], name);
    });

    // Try sorting with a 'by' pattern and 1 'get' pattern.

    client.sort('x', 'by', 'w*', 'asc', 'get', 'o*', function (err, sorted) {
        if (err) {
            assert.fail(err, name);
        }
        assert.deepEqual(buffers_to_strings(sorted), ['foo', 'bar', 'baz', 'buz'], name);
    });

    // Try sorting with a 'by' pattern and 2 'get' patterns.

    client.sort('x', 'by', 'w*', 'asc', 'get', 'o*', 'get', 'p*', function (err, sorted) {
        if (err) {
            assert.fail(err, name);
        }
        assert.deepEqual(buffers_to_strings(sorted), ['foo', 'bux', 'bar', 'tux', 'baz', 'lux', 'buz', 'qux'], name);
    });

    // Try sorting with a 'by' pattern and 2 'get' patterns.
    // Instead of getting back the sorted set/list, store the values to a list.
    // Then check that the values are there in the expected order.

    client.sort('x', 'by', 'w*', 'asc', 'get', 'o*', 'get', 'p*', 'store', 'bacon', function (err) {
        if (err) {
            assert.fail(err, name);
        }
    });

    client.lrange('bacon', 0, -1, function (err, values) {
        if (err) {
            assert.fail(err, name);
        }
        assert.deepEqual(buffers_to_strings(values), ['foo', 'bux', 'bar', 'tux', 'baz', 'lux', 'buz', 'qux'], name);
        next(name);
    });
    
    // TODO - sort by hash value
};

tests.BLPOP = function () {
    var name = "BLPOP";
    
    client.rpush("blocking list", "initial value", function (err, res) {
        client2.BLPOP("blocking list", 0, function (err, res) {
            assert.strictEqual("blocking list", res[0].toString());
            assert.strictEqual("initial value", res[1].toString());
            
            client.rpush("blocking list", "wait for this value");
        });
        client2.BLPOP("blocking list", 0, function (err, res) {
            assert.strictEqual("blocking list", res[0].toString());
            assert.strictEqual("wait for this value", res[1].toString());
            next(name);
        });
    });
};

tests.BLPOP_TIMEOUT = function () {
    var name = "BLPOP_TIMEOUT";
    
    // try to BLPOP the list again, which should be empty.  This should timeout and return null.
    client2.BLPOP("blocking list", 1, function (err, res) {
        if (err) {
            throw err;
        }

        assert.strictEqual(res, null);
        next(name);
    });
};

tests.EXPIRE = function () {
    var name = "EXPIRE";
    client.set(['expiry key', 'bar'], require_string("OK", name));
    client.EXPIRE(["expiry key", "1"], require_number_pos(name));
    setTimeout(function () {
        client.exists(["expiry key"], last(name, require_number(0, name)));
    }, 2000);
};

tests.TTL = function () {
    var name = "TTL";
    client.set(["ttl key", "ttl val"], require_string("OK", name));
    client.expire(["ttl key", "100"], require_number_pos(name));
    setTimeout(function () {
        client.TTL(["ttl key"], last(name, require_number_pos(0, name)));
    }, 500);
};


var all_tests = Object.keys(tests),
    all_start = new Date(), cur_start, test_count = 0;

function run_next_test() {
    var test_name = all_tests.shift();
    if (typeof tests[test_name] === "function") {
        util.print('- \x1b[1m' + test_name.toLowerCase() + '\x1b[0m:');
        cur_start = new Date();
        test_count += 1;
        tests[test_name]();
    } else {
        console.log('\n  completed \x1b[32m%d\x1b[0m tests in \x1b[33m%d\x1b[0m ms\n', test_count, new Date() - all_start);
        client.quit();
        client2.quit();
    }
}

console.log("Using reply parser " + client.reply_parser.name);

client.on("connect", function start_tests() {
    // remove listener so we don't restart all tests on reconnect
    client.removeListener("connect", start_tests);

    // Fetch and stash info results in case anybody needs info on the server we are using.
    client.info(function (err, reply) {
        var obj = {};
        reply.toString().split('\n').forEach(function (line) {
            var parts = line.split(':');
            if (parts[1]) {
                obj[parts[0]] = parts[1];
            }
        });
        obj.versions = [];
        obj.redis_version.split('.').forEach(function (num) {
            obj.versions.push(+num);
        });
        server_info = obj;
        console.log("Connected to " + client.host + ":" + client.port + ", Redis server version " + obj.redis_version + "\n");

        run_next_test();
    });

    connected = true;
});

client.on('end', function () {
  ended = true;
});

// Exit immediately on connection failure, which triggers "exit", below, which fails the test
client.on("error", function (err) {
    console.error("client: " + err.stack);
    process.exit();
});
client2.on("error", function (err) {
    console.error("client2: " + err.stack);
    process.exit();
});
client3.on("error", function (err) {
    console.error("client3: " + err.stack);
    process.exit();
});

client.on("reconnecting", function (params) {
    console.log("reconnecting: " + util.inspect(params));
});

process.on('uncaughtException', function (err) {
    console.log("Uncaught exception: " + err.stack);
});

process.on('exit', function (code) {
    assert.equal(true, connected);
    assert.equal(true, ended);
});
