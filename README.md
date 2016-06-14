redis - a node.js redis client
===========================

[![Build Status](https://travis-ci.org/NodeRedis/node_redis.svg?branch=master)](https://travis-ci.org/NodeRedis/node_redis)
[![Coverage Status](https://coveralls.io/repos/NodeRedis/node_redis/badge.svg?branch=)](https://coveralls.io/r/NodeRedis/node_redis?branch=)
[![Windows Tests](https://img.shields.io/appveyor/ci/BridgeAR/node-redis/master.svg?label=Windows%20Tests)](https://ci.appveyor.com/project/BridgeAR/node-redis/branch/master)
[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/NodeRedis/node_redis?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

This is a complete and feature rich Redis client for node.js. It supports all Redis commands and focuses on high performance.

Install with:

    npm install redis

## Usage Example

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

Note that the API is entirely asynchronous. To get data back from the server, you'll need to use a callback.
From v.2.6 on the API supports camelCase and snake_case and all options / variables / events etc. can be used either way.
It is recommended to use camelCase as this is the default for the Node.js landscape.

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
Examples:

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

Minimal parsing is done on the replies. Commands that return a integer return JavaScript Numbers, arrays return JavaScript Array. `HGETALL` returns an Object keyed by the hash keys. All strings will either be returned as string or as buffer depending on your setting.
Please be aware that sending null, undefined and Boolean values will result in the value coerced to a string!

# API

## Connection and other Events

`client` will emit some events about the state of the connection to the Redis server.

### "ready"

`client` will emit `ready` once a connection is established. Commands issued before the `ready` event are queued,
then replayed just before this event is emitted.

### "connect"

`client` will emit `connect` as soon as the stream is connected to the server.

### "reconnecting"

`client` will emit `reconnecting` when trying to reconnect to the Redis server after losing the connection. Listeners
are passed an object containing `delay` (in ms) and `attempt` (the attempt #) attributes.

### "error"

`client` will emit `error` when encountering an error connecting to the Redis server or when any other in node_redis occurs.
If you use a command without callback and encounter a ReplyError it is going to be emitted to the error listener.

So please attach the error listener to node_redis.

### "end"

`client` will emit `end` when an established Redis server connection has closed.

### "drain" (deprecated)

`client` will emit `drain` when the TCP connection to the Redis server has been buffering, but is now
writable. This event can be used to stream commands in to Redis and adapt to backpressure.

If the stream is buffering `client.should_buffer` is set to true. Otherwise the variable is always set to false.
That way you can decide when to reduce your send rate and resume sending commands when you get `drain`.

You can also check the return value of each command as it will also return the backpressure indicator (deprecated).
If false is returned the stream had to buffer.

### "warning"

`client` will emit `warning` when password was set but none is needed and if a deprecated option / function / similar is used.

### "idle" (deprecated)

`client` will emit `idle` when there are no outstanding commands that are awaiting a response.

## redis.createClient()
If you have `redis-server` running on the same machine as node, then the defaults for
port and host are probably fine and you don't need to supply any arguments. `createClient()` returns a `RedisClient` object. Otherwise, `createClient()` accepts these arguments:

* `redis.createClient([options])`
* `redis.createClient(unix_socket[, options])`
* `redis.createClient(redis_url[, options])`
* `redis.createClient(port[, host][, options])`

__Tip:__ If the Redis server runs on the same machine as the client consider using unix sockets if possible to increase throughput.

#### `options` object properties
| Property  | Default   | Description |
|-----------|-----------|-------------|
| host      | 127.0.0.1 | IP address of the Redis server |
| port      | 6379      | Port of the Redis server |
| path      | null      | The UNIX socket string of the Redis server |
| url       | null      | The URL of the Redis server. Format: `[redis:]//[[user][:password@]][host][:port][/db-number][?db=db-number[&password=bar[&option=value]]]` (More info avaliable at [IANA](http://www.iana.org/assignments/uri-schemes/prov/redis)). |
| parser    | javascript | __Deprecated__ Use either the built-in JS parser [`javascript`]() or the native [`hiredis`]() parser. __Note__ `node_redis` < 2.6 uses hiredis as default if installed. This changed in v.2.6.0. |
| string_numbers | null | Set to `true`, `node_redis` will return Redis number values as Strings instead of javascript Numbers. Useful if you need to handle big numbers (above `Number.MAX_SAFE_INTEGER === 2^53`). Hiredis is incapable of this behavior, so setting this option to `true` will result in the built-in javascript parser being used no matter the value of the `parser` option. |
| return_buffers | false | If set to `true`, then all replies will be sent to callbacks as Buffers instead of Strings. |
| detect_buffers | false | If set to `true`, then replies will be sent to callbacks as Buffers. This option lets you switch between Buffers and Strings on a per-command basis, whereas `return_buffers` applies to every command on a client. __Note__: This doesn't work properly with the pubsub mode. A subscriber has to either always return Strings or Buffers. |
| socket_keepalive | true | If set to `true`, the keep-alive functionality is enabled on the underlying socket. |
| no_ready_check | false |  When a connection is established to the Redis server, the server might still be loading the database from disk. While loading, the server will not respond to any commands. To work around this, `node_redis` has a "ready check" which sends the `INFO` command to the server. The response from the `INFO` command indicates whether the server is ready for more commands. When ready, `node_redis` emits a `ready` event. Setting `no_ready_check` to `true` will inhibit this check. |
| enable_offline_queue |  true | By default, if there is no active connection to the Redis server, commands are added to a queue and are executed once the connection has been established. Setting `enable_offline_queue` to `false` will disable this feature and the callback will be executed immediately with an error, or an error will be emitted if no callback is specified. |
| retry_max_delay | null | __Deprecated__ _Please use `retry_strategy` instead._ By default, every time the client tries to connect and fails, the reconnection delay almost doubles. This delay normally grows infinitely, but setting `retry_max_delay` limits it to the maximum value provided in milliseconds. |
| connect_timeout | 3600000 | __Deprecated__ _Please use `retry_strategy` instead._ Setting `connect_timeout` limits the total time for the client to connect and reconnect. The value is provided in milliseconds and is counted from the moment a new client is created or from the time the connection is lost. The last retry is going to happen exactly at the timeout time. Default is to try connecting until the default system socket timeout has been exceeded and to try reconnecting until 1h has elapsed. |
| max_attempts | 0 | __Deprecated__ _Please use `retry_strategy` instead._ By default, a client will try reconnecting until connected. Setting `max_attempts` limits total amount of connection attempts. Setting this to 1 will prevent any reconnect attempt. |
| retry_unfulfilled_commands | false | If set to `true`, all commands that were unfulfilled while the connection is lost will be retried after the connection has been reestablished. Use this with caution if you use state altering commands (e.g. `incr`). This is especially useful if you use blocking commands. |
| password | null | If set, client will run Redis auth command on connect. Alias `auth_pass` __Note__ `node_redis` < 2.5 must use `auth_pass` |
| db | null | If set, client will run Redis `select` command on connect. |
| family | IPv4 | You can force using IPv6 if you set the family to 'IPv6'. See Node.js [net](https://nodejs.org/api/net.html) or [dns](https://nodejs.org/api/dns.html) modules on how to use the family type. |
| disable_resubscribing | false | If set to `true`, a client won't resubscribe after disconnecting. |
| rename_commands | null | Passing an object with renamed commands to use instead of the original functions. See the [Redis security topics](http://redis.io/topics/security) for more info. |
| tls | null | An object containing options to pass to [tls.connect](http://nodejs.org/api/tls.html#tls_tls_connect_port_host_options_callback) to set up a TLS connection to Redis (if, for example, it is set up to be accessible via a tunnel). |
| prefix | null | A string used to prefix all used keys (e.g. `namespace:test`). Please be aware that the `keys` command will not be prefixed. The `keys` command has a "pattern" as argument and no key and it would be impossible to determine the existing keys in Redis if this would be prefixed. |
| retry_strategy | function | A function that receives an options object as parameter including the retry `attempt`, the `total_retry_time` indicating how much time passed since the last time connected, the `error` why the connection was lost and the number of `times_connected` in total. If you return a number from this function, the retry will happen exactly after that time in milliseconds. If you return a non-number, no further retry will happen and all offline commands are flushed with errors. Return an error to return that specific error to all offline commands. Example below. |

```js
var redis = require("redis");
var client = redis.createClient({detect_buffers: true});

client.set("foo_rand000000000000", "OK");

// This will return a JavaScript String
client.get("foo_rand000000000000", function (err, reply) {
    console.log(reply.toString()); // Will print `OK`
});

// This will return a Buffer since original key is specified as a Buffer
client.get(new Buffer("foo_rand000000000000"), function (err, reply) {
    console.log(reply.toString()); // Will print `<Buffer 4f 4b>`
});
client.quit();
```

retry_strategy example
```js
var client = redis.createClient({
    retry_strategy: function (options) {
        if (options.error.code === 'ECONNREFUSED') {
            // End reconnecting on a specific error and flush all commands with a individual error
            return new Error('The server refused the connection');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
            // End reconnecting after a specific timeout and flush all commands with a individual error
            return new Error('Retry time exhausted');
        }
        if (options.times_connected > 10) {
            // End reconnecting with built in error
            return undefined;
        }
        // reconnect after
        return Math.max(options.attempt * 100, 3000);
    }
});
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

## backpressure

### stream

The client exposed the used [stream](https://nodejs.org/api/stream.html) in `client.stream` and if the stream or client had to [buffer](https://nodejs.org/api/stream.html#stream_writable_write_chunk_encoding_callback) the command in `client.should_buffer`.
In combination this can be used to implement backpressure by checking the buffer state before sending a command and listening to the stream [drain](https://nodejs.org/api/stream.html#stream_event_drain) event.

## client.quit()

This sends the quit command to the redis server and ends cleanly right after all running commands were properly handled.
If this is called while reconnecting (and therefor no connection to the redis server exists) it is going to end the connection right away instead of
resulting in further reconnections! All offline commands are going to be flushed with an error in that case.

## client.end(flush)

Forcibly close the connection to the Redis server. Note that this does not wait until all replies have been parsed.
If you want to exit cleanly, call `client.quit()` as mentioned above.

You should set flush to true, if you are not absolutely sure you do not care about any other commands.
If you set flush to false all still running commands will silently fail.

This example closes the connection to the Redis server before the replies have been read. You probably don't
want to do this:

```js
var redis = require("redis"),
    client = redis.createClient();

client.set("foo_rand000000000000", "some fantastic value", function (err, reply) {
    // This will either result in an error (flush parameter is set to true)
    // or will silently fail and this callback will not be called at all (flush set to false)
    console.log(err);
});
client.end(true); // No further commands will be processed
client.get("foo_rand000000000000", function (err, reply) {
    console.log(err); // => 'The connection has already been closed.'
});
```

`client.end()` without the flush parameter set to true should NOT be used in production!

## Error handling (>= v.2.6)

All redis errors are returned as `ReplyError`.
All unresolved commands that get rejected due to what ever reason return a `AbortError`.
As subclass of the `AbortError` a `AggregateError` exists. This is emitted in case multiple unresolved commands without callback got rejected in debug_mode.
They are all aggregated and a single error is emitted in that case.

Example:
```js
var redis = require('./');
var assert = require('assert');
var client = redis.createClient();

client.on('error', function (err) {
    assert(err instanceof Error);
    assert(err instanceof redis.AbortError);
    assert(err instanceof redis.AggregateError);
    assert.strictEqual(err.errors.length, 2); // The set and get got aggregated in here
    assert.strictEqual(err.code, 'NR_CLOSED');
});
client.set('foo', 123, 'bar', function (err, res) { // To many arguments
    assert(err instanceof redis.ReplyError); // => true
    assert.strictEqual(err.command, 'SET');
    assert.deepStrictEqual(err.args, ['foo', 123, 'bar']);

    redis.debug_mode = true;
    client.set('foo', 'bar');
    client.get('foo');
    process.nextTick(function () {
        client.end(true); // Force closing the connection while the command did not yet return
        redis.debug_mode = false;
    });
});

```

Every `ReplyError` contains the `command` name in all-caps and the arguments (`args`).

If node_redis emits a library error because of another error, the triggering error is added to the returned error as `origin` attribute.

___Error codes___

node_redis returns a `NR_CLOSED` error code if the clients connection dropped. If a command unresolved command got rejected a `UNERCTAIN_STATE` code is returned.
A `CONNECTION_BROKEN` error code is used in case node_redis gives up to reconnect.

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

Example of the publish / subscribe API. This program opens two
client connections, subscribes to a channel on one of them, and publishes to that
channel on the other:

```js
var redis = require("redis");
var sub = redis.createClient(), pub = redis.createClient();
var msg_count = 0;

sub.on("subscribe", function (channel, count) {
    pub.publish("a nice channel", "I am sending a message.");
    pub.publish("a nice channel", "I am sending a second message.");
    pub.publish("a nice channel", "I am sending my last message.");
});

sub.on("message", function (channel, message) {
    console.log("sub channel " + channel + ": " + message);
    msg_count += 1;
    if (msg_count === 3) {
        sub.unsubscribe();
        sub.quit();
        pub.quit();
    }
});

sub.subscribe("a nice channel");
```

When a client issues a `SUBSCRIBE` or `PSUBSCRIBE`, that connection is put into a "subscriber" mode.
At that point, only commands that modify the subscription set are valid and quit (and depending on the redis version ping as well). When the subscription
set is empty, the connection is put back into regular mode.

If you need to send regular commands to Redis while in subscriber mode, just open another connection with a new client (hint: use `client.duplicate()`).

## Subscriber Events

If a client has subscriptions active, it may emit these events:

### "message" (channel, message)

Client will emit `message` for every message received that matches an active subscription.
Listeners are passed the channel name as `channel` and the message as `message`.

### "pmessage" (pattern, channel, message)

Client will emit `pmessage` for every message received that matches an active subscription pattern.
Listeners are passed the original pattern used with `PSUBSCRIBE` as `pattern`, the sending channel
name as `channel`, and the message as `message`.

### "message_buffer" (channel, message)

This is the same as the `message` event with the exception, that it is always going to emit a buffer.
If you listen to the `message` event at the same time as the `message_buffer`, it is always going to emit a string.

### "pmessage_buffer" (pattern, channel, message)

This is the same as the `pmessage` event with the exception, that it is always going to emit a buffer.
If you listen to the `pmessage` event at the same time as the `pmessage_buffer`, it is always going to emit a string.

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

If you fire many commands at once this is going to boost the execution speed significantly compared to fireing the same commands in a loop without waiting for the result! See the benchmarks for further comparison. Please remember that all commands are kept in memory until they are fired.

## Monitor mode

Redis supports the `MONITOR` command, which lets you see all commands received by the Redis server
across all client connections, including from other client libraries and other computers.

A `monitor` event is going to be emitted for every command fired from any client connected to the server including the monitoring client itself.
The callback for the `monitor` event takes a timestamp from the Redis server, an array of command arguments and the raw monitoring string.

Example:

```js
var client  = require("redis").createClient();
client.monitor(function (err, res) {
    console.log("Entering monitoring mode.");
});
client.set('foo', 'bar');

client.on("monitor", function (time, args, raw_reply) {
    console.log(time + ": " + args); // 1458910076.446514:['set', 'foo', 'bar']
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

## client.duplicate([options][, callback])

Duplicate all current options and return a new redisClient instance. All options passed to the duplicate function are going to replace the original option.
If you pass a callback, duplicate is going to wait until the client is ready and returns it in the callback. If an error occurs in the meanwhile, that is going to return an error instead in the callback.

## client.send_command(command_name[, [args][, callback]])

All Redis commands have been added to the `client` object. However, if new commands are introduced before this library is updated,
you can use `send_command()` to send arbitrary commands to Redis.
The command_name has to be lower case.

All commands are sent as multi-bulk commands. `args` can either be an Array of arguments, or omitted / set to undefined.

## client.connected

Boolean tracking the state of the connection to the Redis server.

## client.command_queue_length

The number of commands that have been sent to the Redis server but not yet replied to. You can use this to
enforce some kind of maximum queue depth for commands while connected.

## client.offline_queue_length

The number of commands that have been queued up for a future connection. You can use this to enforce
some kind of maximum queue depth for pre-connection commands.

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
operations.

```
Lenovo T450s, i7-5600U and 12gb memory
clients: 1, NodeJS: 6.2.0, Redis: 3.2.0, parser: javascript, connected by: tcp
         PING,         1/1 avg/max:   0.02/  5.26 2501ms total,   46916 ops/sec
         PING,  batch 50/1 avg/max:   0.06/  4.35 2501ms total,  755178 ops/sec
   SET 4B str,         1/1 avg/max:   0.02/  4.75 2501ms total,   40856 ops/sec
   SET 4B str,  batch 50/1 avg/max:   0.11/  1.51 2501ms total,  432727 ops/sec
   SET 4B buf,         1/1 avg/max:   0.05/  2.76 2501ms total,   20659 ops/sec
   SET 4B buf,  batch 50/1 avg/max:   0.25/  1.76 2501ms total,  194962 ops/sec
   GET 4B str,         1/1 avg/max:   0.02/  1.55 2501ms total,   45156 ops/sec
   GET 4B str,  batch 50/1 avg/max:   0.09/  3.15 2501ms total,  524110 ops/sec
   GET 4B buf,         1/1 avg/max:   0.02/  3.07 2501ms total,   44563 ops/sec
   GET 4B buf,  batch 50/1 avg/max:   0.10/  3.18 2501ms total,  473171 ops/sec
 SET 4KiB str,         1/1 avg/max:   0.03/  1.54 2501ms total,   32627 ops/sec
 SET 4KiB str,  batch 50/1 avg/max:   0.34/  1.89 2501ms total,  146861 ops/sec
 SET 4KiB buf,         1/1 avg/max:   0.05/  2.85 2501ms total,   20688 ops/sec
 SET 4KiB buf,  batch 50/1 avg/max:   0.36/  1.83 2501ms total,  138165 ops/sec
 GET 4KiB str,         1/1 avg/max:   0.02/  1.37 2501ms total,   39389 ops/sec
 GET 4KiB str,  batch 50/1 avg/max:   0.24/  1.81 2501ms total,  208157 ops/sec
 GET 4KiB buf,         1/1 avg/max:   0.02/  2.63 2501ms total,   39918 ops/sec
 GET 4KiB buf,  batch 50/1 avg/max:   0.31/  8.56 2501ms total,  161575 ops/sec
         INCR,         1/1 avg/max:   0.02/  4.69 2501ms total,   45685 ops/sec
         INCR,  batch 50/1 avg/max:   0.09/  3.06 2501ms total,  539964 ops/sec
        LPUSH,         1/1 avg/max:   0.02/  3.04 2501ms total,   41253 ops/sec
        LPUSH,  batch 50/1 avg/max:   0.12/  1.94 2501ms total,  425090 ops/sec
    LRANGE 10,         1/1 avg/max:   0.02/  2.28 2501ms total,   39850 ops/sec
    LRANGE 10,  batch 50/1 avg/max:   0.25/  1.85 2501ms total,  194302 ops/sec
   LRANGE 100,         1/1 avg/max:   0.05/  2.93 2501ms total,   21026 ops/sec
   LRANGE 100,  batch 50/1 avg/max:   1.52/  2.89 2501ms total,   32767 ops/sec
 SET 4MiB str,         1/1 avg/max:   5.16/ 15.55 2502ms total,     193 ops/sec
 SET 4MiB str,  batch 20/1 avg/max:  89.73/ 99.96 2513ms total,     223 ops/sec
 SET 4MiB buf,         1/1 avg/max:   2.23/  8.35 2501ms total,     446 ops/sec
 SET 4MiB buf,  batch 20/1 avg/max:  41.47/ 50.91 2530ms total,     482 ops/sec
 GET 4MiB str,         1/1 avg/max:   2.79/ 10.91 2502ms total,     358 ops/sec
 GET 4MiB str,  batch 20/1 avg/max: 101.61/118.11 2541ms total,     197 ops/sec
 GET 4MiB buf,         1/1 avg/max:   2.32/ 14.93 2502ms total,     430 ops/sec
 GET 4MiB buf,  batch 20/1 avg/max:  65.01/ 84.72 2536ms total,     308 ops/sec
 ```

## Debugging

To get debug output run your `node_redis` application with `NODE_DEBUG=redis`.

This is also going to result in good stack traces opposed to useless ones otherwise for any async operation.
If you only want to have good stack traces but not the debug output run your application in development mode instead (`NODE_ENV=development`).

Good stack traces are only activated in development and debug mode as this results in a significant performance penalty.

___Comparison___:
Useless stack trace:
```
ReplyError: ERR wrong number of arguments for 'set' command
    at parseError (/home/ruben/repos/redis/node_modules/redis-parser/lib/parser.js:158:12)
    at parseType (/home/ruben/repos/redis/node_modules/redis-parser/lib/parser.js:219:14)
```
Good stack trace:
```
ReplyError: ERR wrong number of arguments for 'set' command
    at new Command (/home/ruben/repos/redis/lib/command.js:9:902)
    at RedisClient.set (/home/ruben/repos/redis/lib/commands.js:9:3238)
    at Context.<anonymous> (/home/ruben/repos/redis/test/good_stacks.spec.js:20:20)
    at callFnAsync (/home/ruben/repos/redis/node_modules/mocha/lib/runnable.js:349:8)
    at Test.Runnable.run (/home/ruben/repos/redis/node_modules/mocha/lib/runnable.js:301:7)
    at Runner.runTest (/home/ruben/repos/redis/node_modules/mocha/lib/runner.js:422:10)
    at /home/ruben/repos/redis/node_modules/mocha/lib/runner.js:528:12
    at next (/home/ruben/repos/redis/node_modules/mocha/lib/runner.js:342:14)
    at /home/ruben/repos/redis/node_modules/mocha/lib/runner.js:352:7
    at next (/home/ruben/repos/redis/node_modules/mocha/lib/runner.js:284:14)
    at Immediate._onImmediate (/home/ruben/repos/redis/node_modules/mocha/lib/runner.js:320:5)
    at processImmediate [as _immediateCallback] (timers.js:383:17)
```

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
