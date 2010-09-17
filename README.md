redis - a node redis client
===========================

This is a Redis client for node.  It is designed for node 0.2.1+ and redis 2.0.1+.  It probably won't work on earlier versions of either.

Most Redis commands are implemented, including MULTI.  The notable exceptions are PUBLISH/SUBSCRIBE, and WATCH/UNWATCH.
These should be coming soon.

## Why?

`node_redis` works in the latest versions of node, is published in `npm`, and is very fast.

The most popular Redis client, `redis-node-client` by fictorial, is very mature and well tested.  If you are running an older version
of node or value the maturity and stability of `redis-node-client`, I encourage you to use that one instead.

`node_redis` is designed with performance in mind.  The included `test.js` runs similar tests to `redis-benchmark`, included with the Redis 
distribution, and `test.js` is faster than `redis-benchmarks` for some patterns and slower for others.  `node_redis` is roughly 6X faster at
these benchmarks than `redis-node-client`.

## Usage

Simple example, included as `example.js`:

    var redis = require("redis"),
        client = redis.createClient();

    client.on("connect", function () {
        client.set("string key", "string val", redis.print);
        client.hset("hash key", "hashtest 1", "some value", redis.print);
        client.hset(["hash key", "hashtest 2", "some other value"], redis.print);
        client.hkeys("hash key", function (err, replies) {
            console.log(replies.length + " replies:");
            replies.forEach(function (reply, i) {
                console.log("    " + i + ": " + reply);
            });
            client.end();
        });
    });

This will display:

    mjr:~/work/node_redis (master)$ node example.js 
    Reply: OK
    Reply: 0
    Reply: 0
    2 replies:
        0: hashtest 1
        1: hashtest 2
    mjr:~/work/node_redis (master)$ 


### Sending Commands

Each Redis command is exposed as a function on the `client` object.
All functions take either take either an `args` Array plus optional `callback` Function or
a variable number of individual arguments followed by an optional callback.
Here is an example of passing an array of arguments and a callback:

    client.mset(["test keys 1", "test val 1", "test keys 2", "test val 2"], function (err, res) {});

Here is that same call in the second style:

    client.mset("test keys 1", "test val 1", "test keys 2", "test val 2", function (err, res) {});
    
Note that in either form the `callback` is optional:

    client.set("some key", "some val");
    client.set(["some other key", "some val"]);

For a list of Redis commands, see [Redis Command Reference](http://code.google.com/p/redis/wiki/CommandReference)

The commands can be specified in uppercase or lowercase for convenience.  `client.get()` is the same as `clieint.GET()`.

Minimal parsing is done on the replies.  Commands that return a single line reply return JavaScript Strings, 
integer replies return JavaScript Numbers, "bulk" replies return node Buffers, and "multi bulk" replies return a 
JavaScript Array of node Buffers.

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

# API

## Events

`client` will emit some events about the state of the connection to the Redis server.

### "connect"

`client` will emit `connect` when a connection is established to the Redis server.

### "error"

`client` will emit `error` when encountering an error connecting to the Redis server.

### "end"

`client` will emit `end` when an established Redis server connection has closed.

## redis.createClient(port, host)

Create a new client connection.  `port` defaults to `6379` and `host` defaults
to `127.0.0.1`.  If you have Redis running on the same computer as node, then the defaults are probably fine.

`createClient` returns a `RedisClient` object that is named `client` in all of the examples here.


## `client.end()`

Close the connection to the Redis server.  Note that this does not wait until all replies have been parsed.
If you want to exit cleanly, call `client.end()` in the reply callback of your last command:

    var redis = require("redis"),
        client = redis.createClient();

    client.on("connect", function () {
        client.set("foo_rand000000000000", "some fantastic value");
        client.get("foo_rand000000000000", function (err, reply) {
            console.log(reply.toString());
            client.end();
        });
    });

## `redis.print()`

A handy callback function for displaying return values when testing.  Example:

    var redis = require("redis"),
        client = redis.createClient();

    client.on("connect", function () {
        client.set("foo_rand000000000000", "some fantastic value", redis.print);
        client.get("foo_rand000000000000", redis.print);
    });

This will print:

    Reply: OK
    Reply: some fantastic value

Note that this program will not exit cleanly because the client is still connected.

## `redis.debug_mode`

Boolean to enable debug mode and protocol tracing.

    var redis = require("redis"),
        client = redis.createClient();

    redis.debug_mode = true;

    client.on("connect", function () {
        client.set("foo_rand000000000000", "some fantastic value");
    });

This will display:

    mjr:~/work/node_redis (master)$ node ~/example.js 
    send command: *3
    $3
    SET
    $20
    foo_rand000000000000
    $20
    some fantastic value

    on_data: +OK

`send command` is data sent into Redis and `on_data` is data received from Redis.

## `client.send_command(command_name, args, callback)`

Used internally to send commands to Redis.  For convenience, nearly all commands that are published on the Redis 
Wiki have been added to the `client` object.  However, if I missed any, or if new commands are introduced before
this library is updated, you can use `send_command()` to send arbitrary commands to Redis.

All commands are sent a multi-bulk commands.  `args` can either be an Array of arguments, or individual arguments,
or omitted completely.

## TODO

Need to implement PUBLISH/SUBSCRIBE

Need to implement WATCH/UNWATCH

Add callback for MULTI completion.

Support variable argument style for MULTI commands.

Queue new commands that are sent before a connection has been established.

Stream binary data into and out of Redis.


## Also

This library still needs a lot of work, but it is useful for many things.
There are other Redis libraries available for node, and they might work better for you.

Comments and patches welcome.


## LICENSE - "MIT License"

Copyright (c) 2010 Matthew Ranney, http://ranney.com/

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
