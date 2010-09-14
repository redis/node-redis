var redis = require("./redis"),
    client = redis.createClient(),
    assert = require("assert"),
    inspector = require("eyes").inspector(),
    tests = {};

function require_number(expected, label) {
    return function (err, results) {
        assert.strictEqual(null, err, "result sent back unexpected error");
        assert.strictEqual(expected, results, label + " " + expected + " !== " + results);
        assert.strictEqual(typeof results, "number", label);
    };
}

function require_number_any(label) {
    return function (err, results) {
        assert.strictEqual(null, err, "result sent back unexpected error");
        assert.strictEqual(typeof results, "number", label);
    };
}

function require_number_pos(label) {
    return function (err, results) {
        assert.strictEqual(null, err, "result sent back unexpected error");
        assert.strictEqual(true, (results > 0), label);
    };
}

function require_string(str, label) {
    return function (err, results) {
        assert.strictEqual(null, err, "result sent back unexpected error");
        assert.equal(str, results, label);
    };
}

tests.EXISTS = function () {
    client.del(["foo", "foo2"], require_number_any("EXISTS"));
    client.set(['foo', 'bar'], require_string("OK", "EXISTS"));
    client.EXISTS(['foo'], require_number(1, "EXISTS"));
    client.EXISTS(['foo2'], require_number(0, "EXISTS"));
};

tests.DEL = function () {
    client.DEL(["delkey"], require_number_any("DEL"));
    client.set(["delkey", "delvalue"], require_string("OK", "DEL"));
    client.DEL(["delkey"], require_number(1, "DEL"));
    client.exists(["delkey"], require_number(0, "DEL"));
    client.DEL(["delkey"], require_number(0, "DEL"));
    client.mset(["delkey", "delvalue", "delkey2", "delvalue2"], require_string("OK", "DEL"));
    client.DEL(["delkey", "delkey2"], require_number(2, "DEL"));
};

tests.TYPE = function () {
    client.set(["string key", "should be a string"], require_string("OK", "TYPE"));
    client.rpush(["list key", "should be a list"], require_number_pos("TYPE"));
    client.sadd(["set key", "should be a set"], require_number_any("TYPE"));
    client.zadd(["zset key", "10.0", "should be a zset"], require_number_any("TYPE"));
    client.hset(["hash key", "hashtest", "should be a hash"], require_number_any(0, "TYPE"));
    
    client.TYPE(["string key"], require_string("string", "TYPE"));
    client.TYPE(["list key"], require_string("list", "TYPE"));
    client.TYPE(["set key"], require_string("set", "TYPE"));
    client.TYPE(["zset key"], require_string("zset", "TYPE"));
    client.TYPE(["hash key"], require_string("hash", "TYPE"));
};

tests.KEYS = function () {
    client.mset(["test keys 1", "test val 1", "test keys 2", "test val 2"], require_string("OK", "KEYS"));
    client.KEYS(["test keys*"], function (err, results) {
        assert.strictEqual(null, err, "result sent back unexpected error");
        assert.strictEqual(2, results.length, "KEYS");
        assert.strictEqual("test keys 1", results[0].toString(), "KEYS");
        assert.strictEqual("test keys 2", results[1].toString(), "KEYS");
    });
};

tests.RANDOMKEY = function () {
    client.mset(["test keys 1", "test val 1", "test keys 2", "test val 2"], require_string("OK", "RANDOMKEY"));
    client.RANDOMKEY([], function (err, results) {
        assert.strictEqual(null, err, "result sent back unexpected error");
        assert.strictEqual(true, /\w+/.test(results), "RANDOMKEY");
    });
};

tests.RENAME = function () {
    client.set(['foo', 'bar'], require_string("OK", "RENAME"));
    client.RENAME(["foo", "new foo"], require_string("OK", "RENAME"));
    client.exists(["foo"], require_number(0, "RENAME"));
    client.exists(["new foo"], require_number(1, "RENAME"));
};

tests.RENAMENX = function () {
    client.set(['foo', 'bar'], require_string("OK", "RENAMENX"));
    client.set(['foo2', 'bar2'], require_string("OK", "RENAMENX"));
    client.RENAMENX(["foo", "foo2"], require_number(0, "RENAMENX"));
    client.exists(["foo"], require_number(1, "RENAMENX"));
    client.exists(["foo2"], require_number(1, "RENAMENX"));
    client.del(["foo2"], require_number(1, "RENAMENX"));
    client.RENAMENX(["foo", "foo2"], require_number(1, "RENAMENX"));
    client.exists(["foo"], require_number(0, "RENAMENX"));
    client.exists(["foo2"], require_number(1, "RENAMENX"));
};

tests.DBSIZE = function () {
    client.set(['foo', 'bar'], require_string("OK", "DBSIZE"));
    client.DBSIZE([], require_number_pos("DBSIZE"));
};

tests.EXPIRE = function () {
    client.set(['expiry key', 'bar'], require_string("OK", "EXPIRE"));
    client.EXPIRE(["expiry key", "1"], require_number_pos("EXPIRE"));
    setTimeout(function () {
        client.exists(["expiry key"], require_number(0, "EXPIRE"));
    }, 2000);
};

tests.TTL = function () {
    client.set(["ttl key", "ttl val"], require_string("OK", "TTL"));
    client.expire(["ttl key", "100"], require_number_pos("TTL"));
    setTimeout(function () {
        client.TTL(["ttl key"], require_number_pos(0, "TTL"));
    }, 500);
};

tests.FLUSHDB = function () {
    client.mset(["flush keys 1", "flush val 1", "flush keys 2", "flush val 2"], require_string("OK", "FLUSHDB"));
    setTimeout(function () {
        client.FLUSHDB([], require_string("OK", "FLUSHDB"));
        client.dbsize([], require_number(0, "FLUSHDB"));
    }, 3000);
};

tests.GET = function () {
    client.set(["get key", "get val"], require_string("OK", "GET"));
    client.GET(["get key"], require_string("get val", "GET"));
};

tests.SET = function () {
    client.SET(["set key", "set val"], require_string("OK", "SET"));
    client.get(["set key"], require_string("set val", "SET"));
};

tests.GETSET = function () {
    client.set(["getset key", "getset val"], require_string("OK", "GETSET"));
    client.GETSET(["getset key", "new getset val"], require_string("getset val", "GETSET"));
    client.get(["getset key"], require_string("new getset val", "GETSET"));
};

tests.MGET = function () {
    client.mset(["mget keys 1", "mget val 1", "mget keys 2", "mget val 2", "mget keys 3", "mget val 3"], require_string("OK", "MGET"));
    client.MGET(["mget keys 1", "mget keys 2", "mget keys 3"], function (err, results) {
        assert.strictEqual(null, err, "result sent back unexpected error");
        assert.strictEqual(3, results.length, "MGET");
        assert.strictEqual("mget val 1", results[0].toString(), "MGET");
        assert.strictEqual("mget val 2", results[1].toString(), "MGET");
        assert.strictEqual("mget val 3", results[2].toString(), "MGET");
    });
    client.MGET(["mget keys 1", "some random shit", "mget keys 2", "mget keys 3"], function (err, results) {
        assert.strictEqual(null, err, "result sent back unexpected error");
        assert.strictEqual(4, results.length, "MGET");
        assert.strictEqual("mget val 1", results[0].toString(), "MGET");
        assert.strictEqual(null, results[1], "MGET");
        assert.strictEqual("mget val 2", results[2].toString(), "MGET");
        assert.strictEqual("mget val 3", results[3].toString(), "MGET");
    });
};

client.on("connect", function () {
    console.log("Tester got connection, initializing database for tests.");
    client.FLUSHDB([], require_string("OK", "test init"));
    redis.commands.forEach(function (command) {
        try {
            if (typeof tests[command] === "function") {
                console.log(command);
                tests[command]();
            } else {
                console.log("No test for " + command);
            }
        } catch (err) {
            console.log("Error testing command " + command + " " + err.stack);
        }
    });
});

process.on('uncaughtException', function (err) {
    console.log("Uncaught exception: " + err);
});
