redis - a node redis client
===========================

This is a Redis client for node.  It is designed for node 0.2.1+ and redis 2.0.1+.

Example usage:

    var redis = require("redis"),
        client = redis.createClient();

    client.on("connect", function () {
        client.set(["string key", "string val"], function (err, results) {
            console.log("SET: " + results);
        });
        client.hset(["hash key", "hashtest 1", "should be a hash"], function (err, results) {
            console.log("HSET: " + results);
        });
        client.hset(["hash key", "hashtest 2", "should be a hash"], function (err, results) {
            console.log("HSET: " + results);
        });
        client.hkeys(["hash key"], function (err, results) {
            console.log("HKEYS: " + results);
        });
    });

This will display:

    SET: OK
    HSET: 1
    HSET: 1
    HKEYS: hashtest 1,hashtest 2

More instructions will be available as soon as the tests all pass.
