redis - a node redis client
===========================

This is a Redis client for node.  It is designed for node 0.2.2+ and redis 2.0.1+.  It might not work on earlier versions of either,
although it probably will.

This client supports MULTI and PUBLISH/SUBSCRIBE.

Install with:

    npm install redis

## Why?

`node_redis` works in the latest versions of node, is published in `npm`, and is very fast, particularly for small responses.

The most popular Redis client, `redis-node-client` by fictorial, is very mature and well tested.  If you are running an older version
of node or value the maturity and stability of `redis-node-client`, I encourage you to use that one instead.

`node_redis` is designed with performance in mind.  The included `bench.js` runs similar tests to `redis-benchmark`, included with the Redis 
distribution, and `bench.js` is as fast as `redis-benchmark` for some patterns and slower for others.  `node_redis` has many lovingly
hand-crafted optimizations for speed.


## Usage

Simple example, included as `example.js`:

    var redis = require("redis"),
        client = redis.createClient();

    client.on("error", function (err) {
        console.log("Redis connection error to " + client.host + ":" + client.port + " - " + err);
    });

    client.set("string key", "string val", redis.print);
    client.hset("hash key", "hashtest 1", "some value", redis.print);
    client.hset(["hash key", "hashtest 2", "some other value"], redis.print);
    client.hkeys("hash key", function (err, replies) {
        console.log(replies.length + " replies:");
        replies.forEach(function (reply, i) {
            console.log("    " + i + ": " + reply);
        });
        client.quit();
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

The commands can be specified in uppercase or lowercase for convenience.  `client.get()` is the same as `client.GET()`.

Minimal parsing is done on the replies.  Commands that return a single line reply return JavaScript Strings, 
integer replies return JavaScript Numbers, "bulk" replies return node Buffers, and "multi bulk" replies return a 
JavaScript Array of node Buffers.  `HGETALL` returns an Object with Buffers keyed by the hash keys.

# API

## Connection Events

`client` will emit some events about the state of the connection to the Redis server.

### "connect"

`client` will emit `connect` when a connection is established to the Redis server.

Commands issued before the `connect` event are queued, then replayed when a connection is established.

### "error"

`client` will emit `error` when encountering an error connecting to the Redis server.

Note that "error" is a special event type in node.  If there are no listeners for an 
"error" event, node will exit.  This is usually what you want, but it can lead to some 
cryptic error messages like this:

    mjr:~/work/node_redis (master)$ node example.js 

    node.js:50
        throw e;
        ^
    Error: ECONNREFUSED, Connection refused
        at IOWatcher.callback (net:870:22)
        at node.js:607:9

Not very useful in diagnosing the problem, but if your program isn't ready to handle this,
it is probably the right thing to just exit.

### "end"

`client` will emit `end` when an established Redis server connection has closed.

## redis.createClient(port, host)

Create a new client connection.  `port` defaults to `6379` and `host` defaults
to `127.0.0.1`.  If you have Redis running on the same computer as node, then the defaults are probably fine.

`createClient` returns a `RedisClient` object that is named `client` in all of the examples here.


## client.end()

Forcibly close the connection to the Redis server.  Note that this does not wait until all replies have been parsed.
If you want to exit cleanly, call `client.quit()` to send the `QUIT` command after you have handled all replies.

This example closes the connection to the Redis server before the replies have been read.  You probably don't 
want to do this:

    var redis = require("redis"),
        client = redis.createClient();

    client.set("foo_rand000000000000", "some fantastic value");
    client.get("foo_rand000000000000", function (err, reply) {
        console.log(reply.toString());
    });
    client.end();

`client.end()` is useful for timeout cases where something is stuck or taking too long and you want 
to start over.

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

## client.multi([commands])

`MULTI` commands are queued up until an `EXEC` is issued, and then all commands are run atomically by
Redis.  The interface in `node_redis` is to return an individual `Multi` object by calling `client.multi()`.

    var redis  = require("./index"),
        client = redis.createClient(), set_size = 20;

    client.sadd("bigset", "a member");
    client.sadd("bigset", "another member");

    while (set_size > 0) {
        client.sadd("bigset", "member " + set_size);
        set_size -= 1;
    }

    // multi chain with an individual callback
    client.multi()
        .scard("bigset")
        .smembers("bigset")
        .keys("*", function (err, replies) {
            client.mget(replies, redis.print);
        })
        .dbsize()
        .exec(function (err, replies) {
            console.log("MULTI got " + replies.length + " replies");
            replies.forEach(function (reply, index) {
                console.log("Reply " + index + ": " + reply.toString());
            });
        });

`client.multi()` is a constructor that returns a `Multi` object.  `Multi` objects share all of the 
same command methods as `client` objects do.  Commands are queued up inside the `Multi` object
until `Multi.exec()` is invoked.

You can either chain together `MULTI` commands as in the above example, or you can queue individual 
commands while still sending regular client command as in this example:

    var redis  = require("redis"),
        client = redis.createClient(), multi;

    // start a separate multi command queue 
    multi = client.multi();
    multi.incr("incr thing", redis.print);
    multi.incr("incr other thing", redis.print);

    // runs immediately
    client.mset("incr thing", 100, "incr other thing", 1, redis.print);

    // drains multi queue and runs atomically
    multi.exec(function (err, replies) {
        console.log(replies); // 101, 2
    });

    // you can re-run the same transaction if you like
    multi.exec(function (err, replies) {
        console.log(replies); // 102, 3
        client.quit();
    });

In addition to adding commands to the `MULTI` queue individually, you can also pass an array 
of commands and arguments to the constructor:

    var redis  = require("redis"),
        client = redis.createClient(), multi;

    client.multi([
        ["mget", "multifoo", "multibar", redis.print],
        ["incr", "multifoo"],
        ["incr", "multibar"]
    ]).exec(function (err, replies) {
        console.log(replies);
    });


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

## client.connected

Boolean tracking the state of the connection to the Redis server.

## client.command_queue.length

The number of commands that have been sent to the Redis server but not yet replied to.  You can use this to 
enforce some kind of maximum queue depth for commands while connected.

Don't mess with `client.command_queue` though unless you really know what you are doing.

## client.offline_queue.length

The number of commands that have been queued up for a future connection.  You can use this to enforce
some kind of maximum queue depth for pre-connection commands.

## client.retry_delay

Current delay in milliseconds before a connection retry will be attempted.  This starts at `250`.

## client.retry_backoff

Multiplier for future retry timeouts.  This should be larger than 1 to add more time between retries.
Defaults to 1.7.  The default initial connection retry is 250, so the second retry will be 425, followed by 723.5, etc.


## TODO

Need to add WATCH/UNWATCH.

Stream large set/get into and out of Redis.

Performance can be better for large values.

I think there are more performance improvements left in there for smaller values, especially for large lists of small values.


## Also

This library might still have some bugs in it, but it seems to be quite useful for a lot of people at this point.
There are other Redis libraries available for node, and they might work better for you.

Comments and patches welcome.

## Contributors

Some people have have added features and fixed bugs in `node_redis` other than me.

In order of first contribution, they are:

*  [Tim Smart](http://github.com/Tim-Smart)
*  [TJ Holowaychuk](http://github.com/visionmedia)
*  [Rick Olson](http://github.com/technoweenie)
*  [Orion Henry](http://github.com/orionz)
*  [Hank Sims](http://github.com/hanksims)
*  [Aivo Paas](http://github.com/aivopaas)

Thanks.

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
