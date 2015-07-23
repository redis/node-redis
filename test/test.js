return;

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

    client.sadd('foo', 'x', require_number(1, name));
    client.sadd('foo', 'a', require_number(1, name));
    client.sadd('foo', 'b', require_number(1, name));
    client.sadd('foo', 'c', require_number(1, name));

    client.sadd('bar', 'c', require_number(1, name));

    client.sadd('baz', 'a', require_number(1, name));
    client.sadd('baz', 'd', require_number(1, name));

    // NB: SDIFFSTORE returns the number of elements in the dstkey

    client.sdiffstore('quux', 'foo', 'bar', 'baz', require_number(2, name));

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
    var name = "SMEMBERS";

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

    client.sinterstore('foo', 'sa', 'sb', 'sc', require_number(1, name));

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
};

tests.MONITOR = function () {
    var name = "MONITOR", responses = [], monitor_client;

    if (!server_version_at_least(client, [2, 6, 0])) {
        console.log("Skipping " + name + " for old Redis server version < 2.6.x");
        return next(name);
    }

    monitor_client = redis.createClient(PORT, HOST, { parser: parser });
    monitor_client.monitor(function (err, res) {
        client.mget("some", "keys", "foo", "bar");
        client.set("json", JSON.stringify({
            foo: "123",
            bar: "sdflkdfsjk",
            another: false
        }));
    });
    monitor_client.on("monitor", function (time, args) {
        // skip monitor command for Redis <= 2.4.16
        if (args[0] === "monitor") return;

        responses.push(args);
        if (responses.length === 2) {
            assert.strictEqual(5, responses[0].length);
            assert.strictEqual("mget", responses[0][0]);
            assert.strictEqual("some", responses[0][1]);
            assert.strictEqual("keys", responses[0][2]);
            assert.strictEqual("foo", responses[0][3]);
            assert.strictEqual("bar", responses[0][4]);
            assert.strictEqual(3, responses[1].length);
            assert.strictEqual("set", responses[1][0]);
            assert.strictEqual("json", responses[1][1]);
            assert.strictEqual('{"foo":"123","bar":"sdflkdfsjk","another":false}', responses[1][2]);
            monitor_client.quit(function (err, res) {
                next(name);
            });
        }
    });
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

tests.OPTIONAL_CALLBACK = function () {
    var name = "OPTIONAL_CALLBACK";
    client.del("op_cb1");
    client.set("op_cb1", "x");
    client.get("op_cb1", last(name, require_string("x", name)));
};

tests.OPTIONAL_CALLBACK_UNDEFINED = function () {
    var name = "OPTIONAL_CALLBACK_UNDEFINED";
    client.del("op_cb2");
    client.set("op_cb2", "y", undefined);
    client.get("op_cb2", last(name, require_string("y", name)));

    client.set("op_cb_undefined", undefined, undefined);
};

tests.SLOWLOG = function () {
    var name = "SLOWLOG";
    client.config("set", "slowlog-log-slower-than", 0, require_string("OK", name));
    client.slowlog("reset", require_string("OK", name));
    client.set("foo", "bar", require_string("OK", name));
    client.get("foo", require_string("bar", name));
    client.slowlog("get", function (err, res) {
        assert.equal(res.length, 3, name);
        assert.equal(res[0][3].length, 2, name);
        assert.deepEqual(res[1][3], ["set", "foo", "bar"], name);
        assert.deepEqual(res[2][3], ["slowlog", "reset"], name);
        client.config("set", "slowlog-log-slower-than", 10000, require_string("OK", name));
        next(name);
    });
};
