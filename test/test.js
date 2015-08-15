return;

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
