redis - a node redis client
===========================

This is a Redis client for node.  It is designed for node 0.2.1+ and redis 2.0.1+.

Most Redis commands are implemented.  The notable exceptions are PUBLISH/SUBSCRIBE, and WATCH/UNWATCH.
These should be coming soon.

## Usage

Simple example:

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

Each Redis command is exposed as a function.  All functions take two arguments: an array of arguments to send to 
Redis, and a callback to invoke when Redis sends a reply.  Future versions will support a variable argument
scheme.

For a list of Redis commands, see [Redis Command Reference](http://code.google.com/p/redis/wiki/CommandReference)

The commands can be specified in uppercase or lowercase for convenience.  `client.get` is the same as `clieint.GET`.

Minimal parsing is done on the replies.  Commands that return a single line reply return JavaScript Strings, 
integer replies return JavaScript Numbers, "bulk" replies return node Buffers, and "multi bulk" replies return a 
JavaScript Array of ndoe Buffers.

`MULTI` is supported.  The syntax is a little awkward:

    client.multi([
        ["incr", ["multibar"], function (err, res) {
            console.log(err || res);
        }],
        ["incr", ["multifoo"], function (err, res) {
            console.log(err || res);
        }]
    ]);

`MULTI` takes an Array of 3-element Arrays.  The elements are: `command`, `args`, `callback`.
When the commands are all submitted, `EXEC` is called and the callbacks are invoked in order.
If a command is submitted that doesn't pass the syntax check, it will be removed from the
transaction.

I guess we also need a callback when `MULTI` finishes, in case the last command gets removed from an error.


## TODO

Need to implement PUBLISH/SUBSCRIBE

Need to implement WATCH/UNWATCH

Queue new commands that are sent before a connection has been established.

Sweeten up the syntax to support variable arguments.

Stream binary data into and out of Redis.

## Also

Redis is pretty great.  This library still needs a lot of work, but it is useful for many things.  Patches welcome.
