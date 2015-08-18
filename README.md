redis - a node.js redis client
===========================

[![Build Status](https://travis-ci.org/NodeRedis/node_redis.png)](https://travis-ci.org/NodeRedis/node_redis)
[![Coverage Status](https://coveralls.io/repos/NodeRedis/node_redis/badge.svg?branch=)](https://coveralls.io/r/NodeRedis/node_redis?branch=)

This is a complete Redis client for node.js.  It supports all Redis commands,
including many recently added commands like EVAL from experimental Redis server
branches.

Install with:

    npm install redis

## Usage

Simple example, included as `examples/simple.js`:

```js
    var redis = require("redis"),
        client = redis.createClient();

    // if you'd like to select database 3, instead of 0 (default), call
    // client.select(3, function() { /* ... */ });

    client.on("error", function (err) {
        console.log("Error " + err);
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
```

This will display:

    mjr:~/work/node_redis (master)$ node example.js
    Reply: OK
    Reply: 0
    Reply: 0
    2 replies:
        0: hashtest 1
        1: hashtest 2
    mjr:~/work/node_redis (master)$

Note that the API is entire asynchronous. To get data back from the server,
you'll need to use a callback. The return value from most of the API is a
backpressure indicator.

### Sending Commands

Each Redis command is exposed as a function on the `client` object.
All functions take either an `args` Array plus optional `callback` Function or
a variable number of individual arguments followed by an optional callback.
Here is an example of passing an array of arguments and a callback:

    client.mset(["test keys 1", "test val 1", "test keys 2", "test val 2"], function (err, res) {});

Here is that same call in the second style:

    client.mset("test keys 1", "test val 1", "test keys 2", "test val 2", function (err, res) {});

Note that in either form the `callback` is optional:

    client.set("some key", "some val");
    client.set(["some other key", "some val"]);

If the key is missing, reply will be null (probably):

    client.get("missingkey", function(err, reply) {
        // reply is null when the key is missing
        console.log(reply);
    });

For a list of Redis commands, see [Redis Command Reference](http://redis.io/commands)

The commands can be specified in uppercase or lowercase for convenience.  `client.get()` is the same as `client.GET()`.

Minimal parsing is done on the replies.  Commands that return a single line reply return JavaScript Strings,
integer replies return JavaScript Numbers, "bulk" replies return node Buffers, and "multi bulk" replies return a
JavaScript Array of node Buffers.  `HGETALL` returns an Object with Buffers keyed by the hash keys.

# API

## Connection Events

`client` will emit some events about the state of the connection to the Redis server.

### "ready"

`client` will emit `ready` once a connection is established to the Redis server and the server reports
that it is ready to receive commands.  Commands issued before the `ready` event are queued,
then replayed just before this event is emitted.

### "connect"

`client` will emit `connect` at the same time as it emits `ready` unless `client.options.no_ready_check`
is set.  If this options is set, `connect` will be emitted when the stream is connected, and then
you are free to try to send commands.

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

`client` will also emit `error` if an exception is thrown inside of `node_redis` for whatever reason.
It would be nice to distinguish these two cases.

### "end"

`client` will emit `end` when an established Redis server connection has closed.

### "drain"

`client` will emit `drain` when the TCP connection to the Redis server has been buffering, but is now
writable.  This event can be used to stream commands in to Redis and adapt to backpressure.  Right now,
you need to check `client.command_queue.length` to decide when to reduce your send rate.  Then you can
resume sending when you get `drain`.

### "idle"

`client` will emit `idle` when there are no outstanding commands that are awaiting a response.

## redis.createClient()
If you have `redis-server` running on the same computer as node, then the defaults for
port and host are probably fine and you don't need to supply any arguments. `createClient()` returns a `RedisClient` object.

### overloading
* `redis.createClient(port,host,options)`
* `redis.createClient()` is equivalent to `redis.createClient(6379, '127.0.0.1', {})`
* `redis.createClient(options)` is equivalent to `redis.createClient(6379, '127.0.0.1', options)`
* `redis.createClient(unix_socket, options)`

 `options` is an object with the following possible properties:

* `parser`: which Redis protocol reply parser to use.  Defaults to `hiredis` if that module is installed.
This may also be set to `javascript`.
* `return_buffers`: defaults to `false`.  If set to `true`, then all replies will be sent to callbacks as node Buffer
objects instead of JavaScript Strings.
* `detect_buffers`: default to `false`. If set to `true`, then replies will be sent to callbacks as node Buffer objects
if any of the input arguments to the original command were Buffer objects.
This option lets you switch between Buffers and Strings on a per-command basis, whereas `return_buffers` applies to
every command on a client.
* `socket_nodelay`: defaults to `true`. Whether to call setNoDelay() on the TCP stream, which disables the
Nagle algorithm on the underlying socket.  Setting this option to `false` can result in additional throughput at the
cost of more latency.  Most applications will want this set to `true`.
* `socket_keepalive` defaults to `true`. Whether the keep-alive functionality is enabled on the underlying socket.
* `no_ready_check`: defaults to `false`. When a connection is established to the Redis server, the server might still
be loading the database from disk.  While loading, the server not respond to any commands.  To work around this,
`node_redis` has a "ready check" which sends the `INFO` command to the server.  The response from the `INFO` command
indicates whether the server is ready for more commands.  When ready, `node_redis` emits a `ready` event.
Setting `no_ready_check` to `true` will inhibit this check.
* `enable_offline_queue`: defaults to `true`. By default, if there is no active
connection to the redis server, commands are added to a queue and are executed
once the connection has been established. Setting `enable_offline_queue` to
`false` will disable this feature and the callback will be execute immediately
with an error, or an error will be thrown if no callback is specified.
* `retry_max_delay`: defaults to `null`. By default every time the client tries to connect and fails time before
reconnection (delay) almost doubles. This delay normally grows infinitely, but setting `retry_max_delay` limits delay
to maximum value, provided in milliseconds.
* `connect_timeout` defaults to `false`. By default client will try reconnecting until connected. Setting `connect_timeout`
limits total time for client to reconnect. Value is provided in milliseconds and is counted once the disconnect occured.
* `max_attempts` defaults to `null`. By default client will try reconnecting until connected. Setting `max_attempts`
limits total amount of reconnects.
* `auth_pass` defaults to `null`. By default client will try connecting without auth. If set, client will run redis auth command on connect.
* `family` defaults to `IPv4`. The client connects in IPv4 if not specified or if the DNS resolution returns an IPv4 address.
You can force an IPv6 if you set the family to 'IPv6'. See nodejs net or dns modules how to use the family type.

```js
    var redis = require("redis"),
        client = redis.createClient({detect_buffers: true});

    client.set("foo_rand000000000000", "OK");

    // This will return a JavaScript String
    client.get("foo_rand000000000000", function (err, reply) {
        console.log(reply.toString()); // Will print `OK`
    });

    // This will return a Buffer since original key is specified as a Buffer
    client.get(new Buffer("foo_rand000000000000"), function (err, reply) {
        console.log(reply.toString()); // Will print `<Buffer 4f 4b>`
    });
    client.end();
```



## client.auth(password, callback)

When connecting to Redis servers that require authentication, the `AUTH` command must be sent as the
first command after connecting.  This can be tricky to coordinate with reconnections, the ready check,
etc.  To make this easier, `client.auth()` stashes `password` and will send it after each connection,
including reconnections.  `callback` is invoked only once, after the response to the very first
`AUTH` command sent.
NOTE: Your call to `client.auth()` should not be inside the ready handler. If
you are doing this wrong, `client` will emit an error that looks
something like this `Error: Ready check failed: ERR operation not permitted`.

## client.end()

Forcibly close the connection to the Redis server.  Note that this does not wait until all replies have been parsed.
If you want to exit cleanly, call `client.quit()` to send the `QUIT` command after you have handled all replies.

This example closes the connection to the Redis server before the replies have been read.  You probably don't
want to do this:

```js
    var redis = require("redis"),
        client = redis.createClient();

    client.set("foo_rand000000000000", "some fantastic value");
    client.get("foo_rand000000000000", function (err, reply) {
        console.log(reply.toString());
    });
    client.end();
```

`client.end()` is useful for timeout cases where something is stuck or taking too long and you want
to start over.

## client.unref()

Call `unref()` on the underlying socket connection to the Redis server, allowing the program to exit once no more commands are pending.

This is an **experimental** feature, and only supports a subset of the Redis protocol. Any commands where client state is saved on the Redis server, e.g. `*SUBSCRIBE` or the blocking `BL*` commands will *NOT* work with `.unref()`.

```js
var redis = require("redis")
var client = redis.createClient()

/*
    Calling unref() will allow this program to exit immediately after the get command finishes. Otherwise the client would hang as long as the client-server connection is alive.
*/
client.unref()
client.get("foo", function (err, value){
    if (err) throw(err)
    console.log(value)
})
```

## Friendlier hash commands

Most Redis commands take a single String or an Array of Strings as arguments, and replies are sent back as a single String or an Array of Strings.
When dealing with hash values, there are a couple of useful exceptions to this.

### client.hgetall(hash)

The reply from an HGETALL command will be converted into a JavaScript Object by `node_redis`.  That way you can interact
with the responses using JavaScript syntax.

Example:

    client.hmset("hosts", "mjr", "1", "another", "23", "home", "1234");
    client.hgetall("hosts", function (err, obj) {
        console.dir(obj);
    });

Output:

    { mjr: '1', another: '23', home: '1234' }

### client.hmset(hash, obj, [callback])

Multiple values in a hash can be set by supplying an object:

    client.HMSET(key2, {
        "0123456789": "abcdefghij", // NOTE: key and value will be coerced to strings
        "some manner of key": "a type of value"
    });

The properties and values of this Object will be set as keys and values in the Redis hash.

### client.hmset(hash, key1, val1, ... keyn, valn, [callback])

Multiple values may also be set by supplying a list:

    client.HMSET(key1, "0123456789", "abcdefghij", "some manner of key", "a type of value");


## Publish / Subscribe

Here is a simple example of the API for publish / subscribe.  This program opens two
client connections, subscribes to a channel on one of them, and publishes to that
channel on the other:

```js
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
```

When a client issues a `SUBSCRIBE` or `PSUBSCRIBE`, that connection is put into a "subscriber" mode.
At that point, only commands that modify the subscription set are valid.  When the subscription
set is empty, the connection is put back into regular mode.

If you need to send regular commands to Redis while in subscriber mode, just open another connection.

## Subscriber Events

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
`count` is 0, this client has left subscriber mode and no more subscriber events will be emitted.

### "punsubscribe" (pattern, count)

Client will emit `punsubscribe` in response to a `PUNSUBSCRIBE` command.  Listeners are passed the
channel name as `channel` and the new count of subscriptions for this client as `count`.  When
`count` is 0, this client has left subscriber mode and no more subscriber events will be emitted.

## client.multi([commands])

`MULTI` commands are queued up until an `EXEC` is issued, and then all commands are run atomically by
Redis.  The interface in `node_redis` is to return an individual `Multi` object by calling `client.multi()`.

```js
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
            // NOTE: code in this callback is NOT atomic
            // this only happens after the the .exec call finishes.
            client.mget(replies, redis.print);
        })
        .dbsize()
        .exec(function (err, replies) {
            console.log("MULTI got " + replies.length + " replies");
            replies.forEach(function (reply, index) {
                console.log("Reply " + index + ": " + reply.toString());
            });
        });
```

### Multi.exec( callback )

`client.multi()` is a constructor that returns a `Multi` object.  `Multi` objects share all of the
same command methods as `client` objects do.  Commands are queued up inside the `Multi` object
until `Multi.exec()` is invoked.

The `callback` of `.exec()` will get invoked with two arguments:

* `err` **type:** `null | Array` err is either null or an array of Error Objects corresponding the the sequence the commands where chained. The last item of the array will always be an `EXECABORT` type of error originating from the `.exec()` itself.
* `results` **type:** `null | Array` results is an array of responses corresponding the the sequence the commands where chained.

You can either chain together `MULTI` commands as in the above example, or you can queue individual
commands while still sending regular client command as in this example:

```js
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
```

In addition to adding commands to the `MULTI` queue individually, you can also pass an array
of commands and arguments to the constructor:

```js
    var redis  = require("redis"),
        client = redis.createClient(), multi;

    client.multi([
        ["mget", "multifoo", "multibar", redis.print],
        ["incr", "multifoo"],
        ["incr", "multibar"]
    ]).exec(function (err, replies) {
        console.log(replies);
    });
```


## Monitor mode

Redis supports the `MONITOR` command, which lets you see all commands received by the Redis server
across all client connections, including from other client libraries and other computers.

After you send the `MONITOR` command, no other commands are valid on that connection.  `node_redis`
will emit a `monitor` event for every new monitor message that comes across.  The callback for the
`monitor` event takes a timestamp from the Redis server and an array of command arguments.

Here is a simple example:

```js
    var client  = require("redis").createClient(),
        util = require("util");

    client.monitor(function (err, res) {
        console.log("Entering monitoring mode.");
    });

    client.on("monitor", function (time, args) {
        console.log(time + ": " + util.inspect(args));
    });
```

# Extras

Some other things you might like to know about.

## client.server_info

After the ready probe completes, the results from the INFO command are saved in the `client.server_info`
object.

The `versions` key contains an array of the elements of the version string for easy comparison.

    > client.server_info.redis_version
    '2.3.0'
    > client.server_info.versions
    [ 2, 3, 0 ]

## redis.print()

A handy callback function for displaying return values when testing.  Example:

```js
    var redis = require("redis"),
        client = redis.createClient();

    client.on("connect", function () {
        client.set("foo_rand000000000000", "some fantastic value", redis.print);
        client.get("foo_rand000000000000", redis.print);
    });
```

This will print:

    Reply: OK
    Reply: some fantastic value

Note that this program will not exit cleanly because the client is still connected.

## redis.debug_mode

Boolean to enable debug mode and protocol tracing.

```js
    var redis = require("redis"),
        client = redis.createClient();

    redis.debug_mode = true;

    client.on("connect", function () {
        client.set("foo_rand000000000000", "some fantastic value");
    });
```

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

## Multi-word commands

To execute redis multi-word commands like `SCRIPT LOAD` or `CLIENT LIST` pass
the second word as first parameter:

    client.script('load', 'return 1');
    client.multi().script('load', 'return 1').exec(...);
    client.multi([['script', 'load', 'return 1']]).exec(...);

## client.send_command(command_name, args, callback)

Used internally to send commands to Redis.  For convenience, nearly all commands that are published on the Redis
Wiki have been added to the `client` object.  However, if I missed any, or if new commands are introduced before
this library is updated, you can use `send_command()` to send arbitrary commands to Redis.

All commands are sent as multi-bulk commands.  `args` can either be an Array of arguments, or omitted.

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

### Commands with Optional and Keyword arguments

This applies to anything that uses an optional `[WITHSCORES]` or `[LIMIT offset count]` in the [redis.io/commands](http://redis.io/commands) documentation.

Example:
```js
var args = [ 'myzset', 1, 'one', 2, 'two', 3, 'three', 99, 'ninety-nine' ];
client.zadd(args, function (err, response) {
    if (err) throw err;
    console.log('added '+response+' items.');

    // -Infinity and +Infinity also work
    var args1 = [ 'myzset', '+inf', '-inf' ];
    client.zrevrangebyscore(args1, function (err, response) {
        if (err) throw err;
        console.log('example1', response);
        // write your code here
    });

    var max = 3, min = 1, offset = 1, count = 2;
    var args2 = [ 'myzset', max, min, 'WITHSCORES', 'LIMIT', offset, count ];
    client.zrevrangebyscore(args2, function (err, response) {
        if (err) throw err;
        console.log('example2', response);
        // write your code here
    });
});
```

## Performance

Much effort has been spent to make `node_redis` as fast as possible for common
operations. As pipelining happens naturally from shared connections, overall
efficiency goes up.

Here are typical results of `multi_bench.js` which is similar to
`redis-benchmark` from the Redis distribution.  It uses 5 concurrent connections
and shows the difference between pipelines of 1 and 50.

JavaScript parser:

	Client count: 5, node version: 0.10.32, server version: 2.8.18, parser: javascript
	PING,             1/5 min/max/avg/p95:    0/   3/   0.05/   1.00   1103ms total, 18132.37 ops/sec
	PING,            50/5 min/max/avg/p95:    0/   4/   0.81/   2.00    327ms total, 61162.08 ops/sec
	SET 4B str,       1/5 min/max/avg/p95:    0/   2/   0.05/   0.00   1104ms total, 18115.94 ops/sec
	SET 4B str,      50/5 min/max/avg/p95:    0/   3/   0.83/   2.00    333ms total, 60060.06 ops/sec
	SET 4B buf,       1/5 min/max/avg/p95:    0/   2/   0.09/   1.00   1876ms total, 10660.98 ops/sec
	SET 4B buf,      50/5 min/max/avg/p95:    0/  11/   2.55/   4.00   1025ms total, 19512.20 ops/sec
	GET 4B str,       1/5 min/max/avg/p95:    0/   1/   0.05/   1.00   1117ms total, 17905.10 ops/sec
	GET 4B str,      50/5 min/max/avg/p95:    0/   3/   0.87/   2.00    347ms total, 57636.89 ops/sec
	GET 4B buf,       1/5 min/max/avg/p95:    0/   1/   0.05/   1.00   1110ms total, 18018.02 ops/sec
	GET 4B buf,      50/5 min/max/avg/p95:    0/   2/   0.85/   2.00    342ms total, 58479.53 ops/sec
	SET 4KiB str,     1/5 min/max/avg/p95:    0/   1/   0.05/   1.00   1119ms total, 17873.10 ops/sec
	SET 4KiB str,    50/5 min/max/avg/p95:    0/   3/   0.89/   2.00    358ms total, 55865.92 ops/sec
	SET 4KiB buf,     1/5 min/max/avg/p95:    0/   1/   0.09/   1.00   1894ms total, 10559.66 ops/sec
	SET 4KiB buf,    50/5 min/max/avg/p95:    0/   7/   2.57/   4.00   1031ms total, 19398.64 ops/sec
	GET 4KiB str,     1/5 min/max/avg/p95:    0/   6/   0.06/   1.00   1248ms total, 16025.64 ops/sec
	GET 4KiB str,    50/5 min/max/avg/p95:    0/   3/   1.03/   2.00    415ms total, 48192.77 ops/sec
	GET 4KiB buf,     1/5 min/max/avg/p95:    0/   1/   0.06/   1.00   1177ms total, 16992.35 ops/sec
	GET 4KiB buf,    50/5 min/max/avg/p95:    0/  10/   1.02/   2.00    409ms total, 48899.76 ops/sec
	INCR,             1/5 min/max/avg/p95:    0/   2/   0.05/   0.55   1137ms total, 17590.15 ops/sec
	INCR,            50/5 min/max/avg/p95:    0/   2/   0.85/   2.00    343ms total, 58309.04 ops/sec
	LPUSH,            1/5 min/max/avg/p95:    0/   1/   0.06/   1.00   1143ms total, 17497.81 ops/sec
	LPUSH,           50/5 min/max/avg/p95:    0/   3/   0.87/   2.00    350ms total, 57142.86 ops/sec
	LRANGE 10,        1/5 min/max/avg/p95:    0/   2/   0.06/   1.00   1283ms total, 15588.46 ops/sec
	LRANGE 10,       50/5 min/max/avg/p95:    0/   3/   1.12/   2.00    449ms total, 44543.43 ops/sec
	LRANGE 100,       1/5 min/max/avg/p95:    0/   1/   0.09/   1.00   1932ms total, 10351.97 ops/sec
	LRANGE 100,      50/5 min/max/avg/p95:    0/   5/   2.46/   4.00    985ms total, 20304.57 ops/sec
	SET 4MiB buf,     1/5 min/max/avg/p95:    1/   4/   1.37/   2.00    691ms total,   723.59 ops/sec
	SET 4MiB buf,    50/5 min/max/avg/p95:    3/ 166/  57.66/ 116.00    601ms total,   831.95 ops/sec
	GET 4MiB str,     1/5 min/max/avg/p95:   84/ 110/  93.18/ 106.95   9320ms total,    10.73 ops/sec
	GET 4MiB str,    50/5 min/max/avg/p95:  156/7375/3400.10/6840.40   8928ms total,    11.20 ops/sec
	GET 4MiB buf,     1/5 min/max/avg/p95:   84/ 105/  91.21/  99.00   9129ms total,    10.95 ops/sec
	GET 4MiB buf,    50/5 min/max/avg/p95:  424/5704/3518.94/5626.65   9145ms total,    10.93 ops/sec

If you use very large responses in your application, the JavaScript parser
performs badly. Until the JS parser is fixed, you can use the C-based `hiredis`
parser bound to the official `hiredis` C library. To use `hiredis`, do:

    npm install hiredis redis

If the `hiredis` npm module is installed, `node_redis` will use it by default.
Otherwise, the pure JavaScript parser will be used.

If you use `hiredis`, be sure to rebuild it whenever you upgrade your version of
node.  There are mysterious failures that can happen between node and native
code modules after a node upgrade.

Most users find that the JS parser is faster than the `hiredis` parser. Because
of the pain associated with upgrading native code modules, you should only use
`hiredis` if your application needs it.

hiredis parser:

	Client count: 5, node version: 0.10.32, server version: 2.8.18, parser: hiredis
	PING,             1/5 min/max/avg/p95:    0/   3/   0.05/   1.00   1092ms total, 18315.02 ops/sec
	PING,            50/5 min/max/avg/p95:    0/   5/   0.87/   2.00    347ms total, 57636.89 ops/sec
	SET 4B str,       1/5 min/max/avg/p95:    0/   2/   0.06/   1.00   1151ms total, 17376.19 ops/sec
	SET 4B str,      50/5 min/max/avg/p95:    0/   3/   0.83/   2.00    334ms total, 59880.24 ops/sec
	SET 4B buf,       1/5 min/max/avg/p95:    0/   3/   0.09/   1.00   1932ms total, 10351.97 ops/sec
	SET 4B buf,      50/5 min/max/avg/p95:    0/   9/   2.64/   4.00   1059ms total, 18885.74 ops/sec
	GET 4B str,       1/5 min/max/avg/p95:    0/   1/   0.06/   0.00   1185ms total, 16877.64 ops/sec
	GET 4B str,      50/5 min/max/avg/p95:    0/   3/   0.85/   2.00    341ms total, 58651.03 ops/sec
	GET 4B buf,       1/5 min/max/avg/p95:    0/   1/   0.06/   0.00   1179ms total, 16963.53 ops/sec
	GET 4B buf,      50/5 min/max/avg/p95:    0/   3/   0.85/   2.00    340ms total, 58823.53 ops/sec
	SET 4KiB str,     1/5 min/max/avg/p95:    0/   1/   0.06/   1.00   1210ms total, 16528.93 ops/sec
	SET 4KiB str,    50/5 min/max/avg/p95:    0/   3/   0.93/   2.00    372ms total, 53763.44 ops/sec
	SET 4KiB buf,     1/5 min/max/avg/p95:    0/   1/   0.10/   1.00   1967ms total, 10167.77 ops/sec
	SET 4KiB buf,    50/5 min/max/avg/p95:    0/   6/   2.63/   4.00   1053ms total, 18993.35 ops/sec
	GET 4KiB str,     1/5 min/max/avg/p95:    0/   6/   0.06/   1.00   1176ms total, 17006.80 ops/sec
	GET 4KiB str,    50/5 min/max/avg/p95:    0/   4/   1.00/   2.00    399ms total, 50125.31 ops/sec
	GET 4KiB buf,     1/5 min/max/avg/p95:    0/   1/   0.06/   1.00   1158ms total, 17271.16 ops/sec
	GET 4KiB buf,    50/5 min/max/avg/p95:    0/   3/   0.99/   2.00    398ms total, 50251.26 ops/sec
	INCR,             1/5 min/max/avg/p95:    0/   1/   0.05/   0.00   1112ms total, 17985.61 ops/sec
	INCR,            50/5 min/max/avg/p95:    0/   3/   0.84/   2.00    339ms total, 58997.05 ops/sec
	LPUSH,            1/5 min/max/avg/p95:    0/   1/   0.05/   1.00   1131ms total, 17683.47 ops/sec
	LPUSH,           50/5 min/max/avg/p95:    0/   3/   0.86/   2.00    345ms total, 57971.01 ops/sec
	LRANGE 10,        1/5 min/max/avg/p95:    0/   1/   0.06/   1.00   1228ms total, 16286.64 ops/sec
	LRANGE 10,       50/5 min/max/avg/p95:    0/   3/   0.95/   2.00    382ms total, 52356.02 ops/sec
	LRANGE 100,       1/5 min/max/avg/p95:    0/   1/   0.08/   1.00   1567ms total, 12763.24 ops/sec
	LRANGE 100,      50/5 min/max/avg/p95:    0/   6/   1.68/   3.00    675ms total, 29629.63 ops/sec
	SET 4MiB buf,     1/5 min/max/avg/p95:    1/   4/   1.37/   2.00    692ms total,   722.54 ops/sec
	SET 4MiB buf,    50/5 min/max/avg/p95:    3/ 183/  57.79/ 125.00    605ms total,   826.45 ops/sec
	GET 4MiB str,     1/5 min/max/avg/p95:    5/  16/   8.14/  12.95    816ms total,   122.55 ops/sec
	GET 4MiB str,    50/5 min/max/avg/p95:   24/ 323/ 202.98/ 309.00    519ms total,   192.68 ops/sec
	GET 4MiB buf,     1/5 min/max/avg/p95:    6/  13/   8.01/  11.95    802ms total,   124.69 ops/sec
	GET 4MiB buf,    50/5 min/max/avg/p95:   16/ 480/ 203.85/ 435.70    531ms total,   188.32 ops/sec

## TODO

Better tests for auth, disconnect/reconnect, and all combinations thereof.

Stream large set/get values into and out of Redis.  Otherwise the entire value must be in node's memory.

Performance can be better for very large values.

I think there are more performance improvements left in there for smaller values, especially for large lists of small values.

## How to Contribute
- open a pull request and then wait for feedback (if
  [DTrejo](http://github.com/dtrejo) does not get back to you within 2 days,
  comment again with indignation!)

## Contributors
Many people have have added features and fixed bugs in `node_redis`.

Ordered by date of first contribution.
[Auto-generated](http://github.com/dtrejo/node-authors) on Wed Jul 25 2012 19:14:59 GMT-0700 (PDT).

- [Matt Ranney aka `mranney`](https://github.com/mranney)
- [Tim-Smart aka `tim-smart`](https://github.com/tim-smart)
- [Tj Holowaychuk aka `visionmedia`](https://github.com/visionmedia)
- [rick aka `technoweenie`](https://github.com/technoweenie)
- [Orion Henry aka `orionz`](https://github.com/orionz)
- [Aivo Paas aka `aivopaas`](https://github.com/aivopaas)
- [Hank Sims aka `hanksims`](https://github.com/hanksims)
- [Paul Carey aka `paulcarey`](https://github.com/paulcarey)
- [Pieter Noordhuis aka `pietern`](https://github.com/pietern)
- [nithesh aka `nithesh`](https://github.com/nithesh)
- [Andy Ray aka `andy2ray`](https://github.com/andy2ray)
- [unknown aka `unknowdna`](https://github.com/unknowdna)
- [Dave Hoover aka `redsquirrel`](https://github.com/redsquirrel)
- [Vladimir Dronnikov aka `dvv`](https://github.com/dvv)
- [Umair Siddique aka `umairsiddique`](https://github.com/umairsiddique)
- [Louis-Philippe Perron aka `lp`](https://github.com/lp)
- [Mark Dawson aka `markdaws`](https://github.com/markdaws)
- [Ian Babrou aka `bobrik`](https://github.com/bobrik)
- [Felix Geisendörfer aka `felixge`](https://github.com/felixge)
- [Jean-Hugues Pinson aka `undefined`](https://github.com/undefined)
- [Maksim Lin aka `maks`](https://github.com/maks)
- [Owen Smith aka `orls`](https://github.com/orls)
- [Zachary Scott aka `zzak`](https://github.com/zzak)
- [TEHEK Firefox aka `TEHEK`](https://github.com/TEHEK)
- [Isaac Z. Schlueter aka `isaacs`](https://github.com/isaacs)
- [David Trejo aka `DTrejo`](https://github.com/DTrejo)
- [Brian Noguchi aka `bnoguchi`](https://github.com/bnoguchi)
- [Philip Tellis aka `bluesmoon`](https://github.com/bluesmoon)
- [Marcus Westin aka `marcuswestin2`](https://github.com/marcuswestin2)
- [Jed Schmidt aka `jed`](https://github.com/jed)
- [Dave Peticolas aka `jdavisp3`](https://github.com/jdavisp3)
- [Trae Robrock aka `trobrock`](https://github.com/trobrock)
- [Shankar Karuppiah aka `shankar0306`](https://github.com/shankar0306)
- [Ignacio Burgueño aka `ignacio`](https://github.com/ignacio)

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
