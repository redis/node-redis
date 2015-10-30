redis - a node.js redis client
===========================

[![Build Status](https://travis-ci.org/NodeRedis/node_redis.png)](https://travis-ci.org/NodeRedis/node_redis)
[![Coverage Status](https://coveralls.io/repos/NodeRedis/node_redis/badge.svg?branch=)](https://coveralls.io/r/NodeRedis/node_redis?branch=)
[![Windows Tests](https://img.shields.io/appveyor/ci/BridgeAR/node-redis/master.svg?label=Windows%20Tests)](https://ci.appveyor.com/project/BridgeAR/node-redis/branch/master)
[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/NodeRedis/node_redis?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

This is a complete and feature rich Redis client for node.js. It supports all Redis commands and focuses on performance.

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

### Promises

You can also use node_redis with promises by promisifying node_redis with [bluebird](https://github.com/petkaantonov/bluebird) as in:

```js
var redis = require('redis');
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
```

It'll add a *Async* to all node_redis functions (e.g. return client.getAsync().then())

```js
// We expect a value 'foo': 'bar' to be present
// So instead of writing client.get('foo', cb); you have to write:
return client.getAsync('foo').then(function(res) {
    console.log(res); // => 'bar'
});

// Using multi with promises looks like:

return client.multi().get('foo').execAsync().then(function(res) {
    console.log(res); // => 'bar'
});
```

### Sending Commands

Each Redis command is exposed as a function on the `client` object.
All functions take either an `args` Array plus optional `callback` Function or
a variable number of individual arguments followed by an optional callback.
Here are examples how to use the api:

```js
client.hmset(["key", "test keys 1", "test val 1", "test keys 2", "test val 2"], function (err, res) {});
// Works the same as
client.hmset("key", ["test keys 1", "test val 1", "test keys 2", "test val 2"], function (err, res) {});
// Or
client.hmset("key", "test keys 1", "test val 1", "test keys 2", "test val 2", function (err, res) {});
```

Note that in either form the `callback` is optional:

```js
client.set("some key", "some val");
client.set(["some other key", "some val"]);
```

If the key is missing, reply will be null. Only if the [Redis Command Reference](http://redis.io/commands) states something else it will not be null.

```js
client.get("missingkey", function(err, reply) {
    // reply is null when the key is missing
    console.log(reply);
});
```

For a list of Redis commands, see [Redis Command Reference](http://redis.io/commands)

The commands can be specified in uppercase or lowercase for convenience. `client.get()` is the same as `client.GET()`.

Minimal parsing is done on the replies. Commands that return a single line reply return JavaScript Strings,
integer replies return JavaScript Numbers, "bulk" replies return node Buffers, and "multi bulk" replies return a
JavaScript Array of node Buffers. `HGETALL` returns an Object with Buffers keyed by the hash keys.

# API

## Connection Events

`client` will emit some events about the state of the connection to the Redis server.

### "ready"

`client` will emit `ready` once a connection is established. Commands issued before the `ready` event are queued,
then replayed just before this event is emitted.

### "connect"

`client` will emit `connect` at the same time as it emits `ready` unless `client.options.no_ready_check`
is set. If this options is set, `connect` will be emitted when the stream is connected.

### "reconnecting"

`client` will emit `reconnecting` when trying to reconnect to the Redis server after losing the connection. Listeners
are passed an object containing `delay` (in ms) and `attempt` (the attempt #) attributes.

### "error"

`client` will emit `error` when encountering an error connecting to the Redis server or when any other in node_redis occurs.

So please attach the error listener to node_redis.

### "end"

`client` will emit `end` when an established Redis server connection has closed.

### "drain"

`client` will emit `drain` when the TCP connection to the Redis server has been buffering, but is now
writable. This event can be used to stream commands in to Redis and adapt to backpressure.

If the stream is buffering `client.should_buffer` is set to true. Otherwise the variable is always set to false.
That way you can decide when to reduce your send rate and resume sending commands when you get `drain`.

You can also check the return value of each command as it will also return the backpressure indicator.
If false is returned the stream had to buffer.

### "idle"

`client` will emit `idle` when there are no outstanding commands that are awaiting a response.

## redis.createClient()
If you have `redis-server` running on the same computer as node, then the defaults for
port and host are probably fine and you don't need to supply any arguments. `createClient()` returns a `RedisClient` object.

### overloading
* `redis.createClient()`
* `redis.createClient(options)`
* `redis.createClient(unix_socket, options)`
* `redis.createClient('redis://user:pass@host:port', options)`
* `redis.createClient(port, host, options)`

#### `options` is an object with the following possible properties:
* `host`: *127.0.0.1*; The host to connect to
* `port`: *6370*; The port to connect to
* `path`: *null*; The unix socket string to connect to
* `parser`: *hiredis*; Which Redis protocol reply parser to use. If `hiredis` is not installed it will fallback to `javascript`.
* `return_buffers`: *false*; If set to `true`, then all replies will be sent to callbacks as Buffers instead of Strings.
* `detect_buffers`: *false*; If set to `true`, then replies will be sent to callbacks as Buffers. Please be aware that this can't work properly with the pubsub mode. A subscriber has to either always return strings or buffers.
if any of the input arguments to the original command were Buffers.
This option lets you switch between Buffers and Strings on a per-command basis, whereas `return_buffers` applies to
every command on a client.
* `socket_nodelay`: *true*; Disables the [Nagle algorithm](https://en.wikipedia.org/wiki/Nagle%27s_algorithm).
Setting this option to `false` can result in additional throughput at the cost of more latency.
Most applications will want this set to `true`.
* `socket_keepalive` *true*; Whether the keep-alive functionality is enabled on the underlying socket.
* `no_ready_check`: *false*; When a connection is established to the Redis server, the server might still
be loading the database from disk. While loading the server will not respond to any commands. To work around this,
`node_redis` has a "ready check" which sends the `INFO` command to the server. The response from the `INFO` command
indicates whether the server is ready for more commands. When ready, `node_redis` emits a `ready` event.
Setting `no_ready_check` to `true` will inhibit this check.
* `enable_offline_queue`: *true*; By default, if there is no active
connection to the redis server, commands are added to a queue and are executed
once the connection has been established. Setting `enable_offline_queue` to
`false` will disable this feature and the callback will be executed immediately
with an error, or an error will be emitted if no callback is specified.
* `retry_max_delay`: *null*; By default every time the client tries to connect and fails the reconnection delay almost doubles.
This delay normally grows infinitely, but setting `retry_max_delay` limits it to the maximum value, provided in milliseconds.
* `connect_timeout`: *3600000*; Setting `connect_timeout` limits total time for client to connect and reconnect.
The value is provided in milliseconds and is counted from the moment on a new client is created / a connection is lost. The last retry is going to happen exactly at the timeout time.
Default is to try connecting until the default system socket timeout has been exceeded and to try reconnecting until 1h passed.
* `max_attempts`: *0*; By default client will try reconnecting until connected. Setting `max_attempts`
limits total amount of connection tries. Setting this to 1 will prevent any reconnect tries.
* `auth_pass`: *null*; If set, client will run redis auth command on connect.
* `family`: *IPv4*; You can force using IPv6 if you set the family to 'IPv6'. See Node.js [net](https://nodejs.org/api/net.html) or [dns](https://nodejs.org/api/dns.html) modules how to use the family type.
* `disable_resubscribing`: *false*; If set to `true`, a client won't resubscribe after disconnecting
* `rename_commands`: *null*; pass a object with renamed commands to use those instead of the original functions. See the [redis security topics](http://redis.io/topics/security) for more info.

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

## client.auth(password[, callback])

When connecting to a Redis server that requires authentication, the `AUTH` command must be sent as the
first command after connecting. This can be tricky to coordinate with reconnections, the ready check,
etc. To make this easier, `client.auth()` stashes `password` and will send it after each connection,
including reconnections. `callback` is invoked only once, after the response to the very first
`AUTH` command sent.
NOTE: Your call to `client.auth()` should not be inside the ready handler. If
you are doing this wrong, `client` will emit an error that looks
something like this `Error: Ready check failed: ERR operation not permitted`.

## client.end([flush])

Forcibly close the connection to the Redis server. Note that this does not wait until all replies have been parsed.
If you want to exit cleanly, call `client.quit()` to send the `QUIT` command after you have handled all replies.

If flush is set to true, all commands will be rejected instead of ignored after using `.end`.

This example closes the connection to the Redis server before the replies have been read. You probably don't
want to do this:

```js
var redis = require("redis"),
    client = redis.createClient();

client.set("foo_rand000000000000", "some fantastic value");
client.end(); // No further commands will be processed
client.get("foo_rand000000000000", function (err, reply) {
    // This won't be called anymore, since flush has not been set to true!
    console.log(err);
});
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

### client.hgetall(hash, callback)

The reply from an HGETALL command will be converted into a JavaScript Object by `node_redis`. That way you can interact
with the responses using JavaScript syntax.

Example:

```js
client.hmset("hosts", "mjr", "1", "another", "23", "home", "1234");
client.hgetall("hosts", function (err, obj) {
    console.dir(obj);
});
```

Output:

```js
{ mjr: '1', another: '23', home: '1234' }
```

### client.hmset(hash, obj[, callback])

Multiple values in a hash can be set by supplying an object:

```js
client.HMSET(key2, {
    "0123456789": "abcdefghij", // NOTE: key and value will be coerced to strings
    "some manner of key": "a type of value"
});
```

The properties and values of this Object will be set as keys and values in the Redis hash.

### client.hmset(hash, key1, val1, ... keyn, valn, [callback])

Multiple values may also be set by supplying a list:

```js
client.HMSET(key1, "0123456789", "abcdefghij", "some manner of key", "a type of value");
```

## Publish / Subscribe

Here is a simple example of the API for publish / subscribe. This program opens two
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

client1.subscribe("a nice channel");
```

When a client issues a `SUBSCRIBE` or `PSUBSCRIBE`, that connection is put into a "subscriber" mode.
At that point, only commands that modify the subscription set are valid. When the subscription
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

Client will emit `subscribe` in response to a `SUBSCRIBE` command. Listeners are passed the
channel name as `channel` and the new count of subscriptions for this client as `count`.

### "psubscribe" (pattern, count)

Client will emit `psubscribe` in response to a `PSUBSCRIBE` command. Listeners are passed the
original pattern as `pattern`, and the new count of subscriptions for this client as `count`.

### "unsubscribe" (channel, count)

Client will emit `unsubscribe` in response to a `UNSUBSCRIBE` command. Listeners are passed the
channel name as `channel` and the new count of subscriptions for this client as `count`. When
`count` is 0, this client has left subscriber mode and no more subscriber events will be emitted.

### "punsubscribe" (pattern, count)

Client will emit `punsubscribe` in response to a `PUNSUBSCRIBE` command. Listeners are passed the
channel name as `channel` and the new count of subscriptions for this client as `count`. When
`count` is 0, this client has left subscriber mode and no more subscriber events will be emitted.

## client.multi([commands])

`MULTI` commands are queued up until an `EXEC` is issued, and then all commands are run atomically by
Redis. The interface in `node_redis` is to return an individual `Multi` object by calling `client.multi()`.
If any command fails to queue, all commands are rolled back and none is going to be executed (For further information look at [transactions](http://redis.io/topics/transactions)).

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

### Multi.exec([callback])

`client.multi()` is a constructor that returns a `Multi` object. `Multi` objects share all of the
same command methods as `client` objects do. Commands are queued up inside the `Multi` object
until `Multi.exec()` is invoked.

If your code contains an syntax error an EXECABORT error is going to be thrown and all commands are going to be aborted. That error contains a `.errors` property that contains the concret errors.
If all commands were queued successfully and an error is thrown by redis while processing the commands that error is going to be returned in the result array! No other command is going to be aborted though than the onces failing.

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

### Multi.exec_atomic([callback])

Identical to Multi.exec but with the difference that executing a single command will not use transactions.

## client.batch([commands])

Identical to .multi without transactions. This is recommended if you want to execute many commands at once but don't have to rely on transactions.

`BATCH` commands are queued up until an `EXEC` is issued, and then all commands are run atomically by
Redis. The interface in `node_redis` is to return an individual `Batch` object by calling `client.batch()`.
The only difference between .batch and .multi is that no transaction is going to be used.
Be aware that the errors are - just like in multi statements - in the result. Otherwise both, errors and results could be returned at the same time.

If you fire many commands at once this is going to **boost the execution speed by up to 400%** [sic!] compared to fireing the same commands in a loop without waiting for the result! See the benchmarks for further comparison. Please remember that all commands are kept in memory until they are fired.

## Monitor mode

Redis supports the `MONITOR` command, which lets you see all commands received by the Redis server
across all client connections, including from other client libraries and other computers.

After you send the `MONITOR` command, no other commands are valid on that connection. `node_redis`
will emit a `monitor` event for every new monitor message that comes across. The callback for the
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

A handy callback function for displaying return values when testing. Example:

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

## Multi-word commands

To execute redis multi-word commands like `SCRIPT LOAD` or `CLIENT LIST` pass
the second word as first parameter:

    client.script('load', 'return 1');
    client.multi().script('load', 'return 1').exec(...);
    client.multi([['script', 'load', 'return 1']]).exec(...);

## client.send_command(command_name[, [args][, callback]])

Used internally to send commands to Redis. Nearly all Redis commands have been added to the `client` object.
However, if new commands are introduced before this library is updated, you can use `send_command()` to send arbitrary commands to Redis.
The command has to be lower case.

All commands are sent as multi-bulk commands. `args` can either be an Array of arguments, or omitted / set to undefined.

## client.connected

Boolean tracking the state of the connection to the Redis server.

## client.command_queue.length

The number of commands that have been sent to the Redis server but not yet replied to. You can use this to
enforce some kind of maximum queue depth for commands while connected.

Don't mess with `client.command_queue` though unless you really know what you are doing.

## client.offline_queue.length

The number of commands that have been queued up for a future connection. You can use this to enforce
some kind of maximum queue depth for pre-connection commands.

## client.retry_delay

Current delay in milliseconds before a connection retry will be attempted. This starts at `200`.

## client.retry_backoff

Multiplier for future retry timeouts. This should be larger than 1 to add more time between retries.
Defaults to 1.7. The default initial connection retry is 200, so the second retry will be 340, followed by 578, etc.

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

Here are results of `multi_bench.js` which is similar to `redis-benchmark` from the Redis distribution.

hiredis parser (Lenovo T450s i7-5600U):

```
Client count: 1, node version: 4.2.1, server version: 3.0.3, parser: hiredis
         PING,         1/1 min/max/avg/p95:    0/   4/   0.02/   0.00  10001ms total,  38850.41 ops/sec
         PING,  batch 50/1 min/max/avg/p95:    0/   3/   0.10/   1.00  10001ms total, 488376.16 ops/sec
   SET 4B str,         1/1 min/max/avg/p95:    0/   2/   0.03/   0.00  10001ms total,  35782.02 ops/sec
   SET 4B str,  batch 50/1 min/max/avg/p95:    0/   2/   0.14/   1.00  10001ms total, 349740.03 ops/sec
   SET 4B buf,         1/1 min/max/avg/p95:    0/   5/   0.04/   0.00  10001ms total,  23497.75 ops/sec
   SET 4B buf,  batch 50/1 min/max/avg/p95:    0/   3/   0.28/   1.00  10001ms total, 177087.29 ops/sec
   GET 4B str,         1/1 min/max/avg/p95:    0/   4/   0.03/   0.00  10001ms total,  37044.10 ops/sec
   GET 4B str,  batch 50/1 min/max/avg/p95:    0/   4/   0.12/   1.00  10001ms total, 421987.80 ops/sec
   GET 4B buf,         1/1 min/max/avg/p95:    0/   4/   0.03/   0.00  10001ms total,  35608.24 ops/sec
   GET 4B buf,  batch 50/1 min/max/avg/p95:    0/   3/   0.12/   1.00  10001ms total, 416593.34 ops/sec
 SET 4KiB str,         1/1 min/max/avg/p95:    0/   4/   0.03/   0.00  10001ms total,  30014.10 ops/sec
 SET 4KiB str,  batch 50/1 min/max/avg/p95:    0/   4/   0.34/   1.00  10001ms total, 147705.23 ops/sec
 SET 4KiB buf,         1/1 min/max/avg/p95:    0/   4/   0.04/   0.00  10001ms total,  23803.52 ops/sec
 SET 4KiB buf,  batch 50/1 min/max/avg/p95:    0/   4/   0.37/   1.00  10001ms total, 132611.74 ops/sec
 GET 4KiB str,         1/1 min/max/avg/p95:    0/   5/   0.03/   0.00  10001ms total,  34216.98 ops/sec
 GET 4KiB str,  batch 50/1 min/max/avg/p95:    0/   4/   0.32/   1.00  10001ms total, 153039.70 ops/sec
 GET 4KiB buf,         1/1 min/max/avg/p95:    0/   3/   0.03/   0.00  10001ms total,  34169.18 ops/sec
 GET 4KiB buf,  batch 50/1 min/max/avg/p95:    0/   2/   0.32/   1.00  10001ms total, 153264.67 ops/sec
         INCR,         1/1 min/max/avg/p95:    0/   3/   0.03/   0.00  10001ms total,  36307.17 ops/sec
         INCR,  batch 50/1 min/max/avg/p95:    0/   4/   0.12/   1.00  10001ms total, 412438.76 ops/sec
        LPUSH,         1/1 min/max/avg/p95:    0/   4/   0.03/   0.00  10001ms total,  36073.89 ops/sec
        LPUSH,  batch 50/1 min/max/avg/p95:    0/   2/   0.14/   1.00  10001ms total, 355954.40 ops/sec
    LRANGE 10,         1/1 min/max/avg/p95:    0/   2/   0.03/   0.00  10001ms total,  30395.66 ops/sec
    LRANGE 10,  batch 50/1 min/max/avg/p95:    0/   3/   0.33/   1.00  10001ms total, 149400.06 ops/sec
   LRANGE 100,         1/1 min/max/avg/p95:    0/   2/   0.06/   1.00  10001ms total,  16814.62 ops/sec
   LRANGE 100,  batch 50/1 min/max/avg/p95:    1/   4/   2.01/   2.00  10002ms total,  24790.04 ops/sec
 SET 4MiB str,         1/1 min/max/avg/p95:    1/   7/   2.01/   2.00  10002ms total,    496.90 ops/sec
 SET 4MiB str,  batch 20/1 min/max/avg/p95:  100/ 135/ 109.58/ 125.00  10085ms total,    182.45 ops/sec
 SET 4MiB buf,         1/1 min/max/avg/p95:    1/   5/   1.87/   2.00  10001ms total,    531.75 ops/sec
 SET 4MiB buf,  batch 20/1 min/max/avg/p95:   52/  77/  58.90/  68.45  10016ms total,    339.46 ops/sec
 GET 4MiB str,         1/1 min/max/avg/p95:    3/  19/   5.79/  11.00  10005ms total,    172.51 ops/sec
 GET 4MiB str,  batch 20/1 min/max/avg/p95:   73/ 112/  89.89/ 107.00  10072ms total,    222.40 ops/sec
 GET 4MiB buf,         1/1 min/max/avg/p95:    3/  13/   5.35/   9.00  10002ms total,    186.76 ops/sec
 GET 4MiB buf,  batch 20/1 min/max/avg/p95:   76/ 106/  85.37/  98.00  10077ms total,    234.20 ops/sec
 ```

The hiredis and js parser should most of the time be on the same level. The js parser lacks speed for large responses though.
Therefor the hiredis parser is the default used in node_redis and we recommend using the hiredis parser. To use `hiredis`, do:

    npm install hiredis redis

## Debugging

To get debug output run your `node_redis` application with `NODE_DEBUG=redis`.

## How to Contribute
- Open a pull request or an issue about what you want to implement / change. We're glad for any help!
 - Please be aware that we'll only accept fully tested code.

## Contributors

The original author of node_redis is [Matthew Ranney](https://github.com/mranney)

The current lead maintainer is [Ruben Bridgewater](https://github.com/BridgeAR)

Many [others](https://github.com/NodeRedis/node_redis/graphs/contributors) contributed to `node_redis` too. Thanks to all of them!

## License

[MIT](LICENSE)

### Consolidation: It's time for celebration

Right now there are two great redis clients around and both have some advantages above each other. We speak about ioredis and node_redis. So after talking to each other about how we could improve in working together we (that is @luin and @BridgeAR) decided to work towards a single library on the long run. But step by step.

First of all, we want to split small parts of our libraries into others so that we're both able to use the same code. Those libraries are going to be maintained under the NodeRedis organization. This is going to reduce the maintance overhead, allows others to use the very same code, if they need it and it's way easyer for others to contribute to both libraries.

We're very happy about this step towards working together as we both want to give you the best redis experience possible.

If you want to join our cause by help maintaining something, please don't hesitate to contact either one of us.
