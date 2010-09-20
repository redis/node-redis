redis - a node redis client
===========================

This is a Redis client for node.  It is designed for node 0.2.2+ and redis 2.0.1+.  It probably won't work on earlier versions of either.

Most Redis commands are implemented, including MULTI and PUBLISH/SUBSCRIBE.

## Why?

`node_redis` works in the latest versions of node, is published in `npm`, and is very fast.

The most popular Redis client, `redis-node-client` by fictorial, is very mature and well tested.  If you are running an older version
of node or value the maturity and stability of `redis-node-client`, I encourage you to use that one instead.

`node_redis` is designed with performance in mind.  The included `bench.js` runs similar tests to `redis-benchmark`, included with the Redis 
distribution, and `bench.js` is faster than `redis-benchmarks` for some patterns and slower for others.  `node_redis` is roughly 6X faster at
these benchmarks than `redis-node-client`.

## Usage

Simple example, included as `example.js`:

    var redis = require("redis"),
        client = redis.createClient();

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
JavaScript Array of node Buffers.  `HGETALL` returns an Object with Buffers keyed by the hash keys.

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

## Connection Events

`client` will emit some events about the state of the connection to the Redis server.

### "connect"

`client` will emit `connect` when a connection is established to the Redis server.

### "error"

`client` will emit `error` when encountering an error connecting to the Redis server.

_This may change at some point, because it would be nice to send back error events for
things in the reply parser._

### "end"

`client` will emit `end` when an established Redis server connection has closed.

## redis.createClient(port, host)

Create a new client connection.  `port` defaults to `6379` and `host` defaults
to `127.0.0.1`.  If you have Redis running on the same computer as node, then the defaults are probably fine.

`createClient` returns a `RedisClient` object that is named `client` in all of the examples here.


## client.end()

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

## Publish / Subscribe

Here is a simple example of the API for publish / subscribe.  This program opens two
client connections, subscribes to a channel on one of them, and publishes to that 
channel on the other:

    var redis = require("redis"),
        client1 = redis.createClient(), client2 = redis.createClient(),
        msg_count = 0;

    client1.on("subscribe", function (channel, count) {
        client2.publish("a nice channel", "I am sending a message.");
        client2.publish("a nice channel", "I am sending a second message.");
        client2.publish("a nice channel", "I am sending my last message.");
    });

    client1.on("message", function (channel, message) {
        console.log("client1 channel " + channel + ": " + message);
        msg_count += 1;
        if (msg_count === 3) {
            client1.unsubscribe();
            client1.end();
            client2.end();
        }
    });

    client1.incr("did a thing");
    client1.subscribe("a nice channel");

When a client issues a `SUBSCRIBE` or `PSUBSCRIBE`, that connection is put into "pub/sub" mode.
At that point, only commands that modify the subscription set are valid.  When the subscription 
set is empty, the connection is put back into regular mode.

If you need to send regular commands to Redis while in pub/sub mode, just open another connection.

## Pub / Sub Events

If a client has subscriptions active, it may emit these events:

### "message" (channel, message)

Client will emit `message` for every message received that matches an active subscription.
Listeners are passed the channel name as `channel` and the message Buffer as `message`.

### "pmessage" (pattern, channel, message)

Client will emit `pmessage` for every message received that matches an active subscription pattern.
Listeners are passed the original pattern used with `PSUBSCRIBE` as `pattern`, the sending channel
name as `channel`, and the message Buffer as `message`.

### "subscribe" (channel, count)

Client will emit `subscribe` in response to a `SUBSCRIBE` command.  Listeners are passed the 
channel name as `channel` and the new count of subscriptions for this client as `count`.

### "psubscribe" (pattern, count) 

Client will emit `psubscribe` in response to a `PSUBSCRIBE` command.  Listeners are passed the
original pattern as `pattern`, and the new count of subscriptions for this client as `count`.

### "unsubscribe" (channel, count)

Client will emit `unsubscribe` in response to a `UNSUBSCRIBE` command.  Listeners are passed the 
channel name as `channel` and the new count of subscriptions for this client as `count`.  When
`count` is 0, this client has left pub/sub mode and no more pub/sub events will be emitted.

### "punsubscribe" (pattern, count)

Client will emit `punsubscribe` in response to a `PUNSUBSCRIBE` command.  Listeners are passed the 
channel name as `channel` and the new count of subscriptions for this client as `count`.  When
`count` is 0, this client has left pub/sub mode and no more pub/sub events will be emitted.

# Extras

Some other things you might like to know about.

## redis.print()

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

## redis.debug_mode

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

## client.send_command(command_name, args, callback)

Used internally to send commands to Redis.  For convenience, nearly all commands that are published on the Redis 
Wiki have been added to the `client` object.  However, if I missed any, or if new commands are introduced before
this library is updated, you can use `send_command()` to send arbitrary commands to Redis.

All commands are sent as multi-bulk commands.  `args` can either be an Array of arguments, or individual arguments,
or omitted completely.

## TODO

Need to implement WATCH/UNWATCH and progressive MULTI commands.

Add callback for MULTI completion.

Support variable argument style for MULTI commands.

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
