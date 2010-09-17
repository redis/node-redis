redis - a node redis client
===========================

This is a Redis client for node.  It is designed for node 0.2.1+ and redis 2.0.1+.

Most Redis commands are implemented, including MULTI.  The notable exceptions are PUBLISH/SUBSCRIBE, and WATCH/UNWATCH.
These should be coming soon.

## Usage

Simple example:

    var redis = require("redis"),
        client = redis.createClient();

    client.on("connect", function () {
        client.set("string key", "string val", function (err, results) {
            console.log("SET: " + results);
        });
        client.hset("hash key", "hashtest 1", "should be a hash", function (err, results) {
            console.log("HSET: " + results);
        });
        client.hset(["hash key", "hashtest 2", "should be a hash"], function (err, results) {
            console.log("HSET: " + results);
        });
        client.hkeys("hash key", function (err, results) {
            console.log("HKEYS: " + results);
            process.exit();
        });
    });

This will display:

    SET: OK
    HSET: 1
    HSET: 1
    HKEYS: hashtest 1,hashtest 2


### Creating a new Client Connection

Use `redis.createClient(port, host)` to create a new client connection.  `port` defaults to `6379` and `host` defaults
to `127.0.0.1`.  If you have Redis running on the same computer as node, then the defaults are probably fine.

`createClient` returns a `RedisClient` object that is named `client` in all of the examples here.


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
