> :warning: Version 4 is still under development and isn't ready for production use. Use at your own risk.

---

<p align="center">
    <a href="https://github.com/noderedis/node-redis/">
        <img width="190px" src="https://static.invertase.io/assets/node_redis_logo.png" />
    </a>
    <h2 align="center">Node Redis</h2>
    <h4 align="center">A high performance Node.js Redis client.</h4>
</p>

---

<p align="center">
    <a href="https://www.npmjs.com/package/redis"><img src="https://img.shields.io/npm/dm/redis.svg" alt="NPM downloads"/></a>
    <a href="https://www.npmjs.com/package/redis"><img src="https://img.shields.io/npm/v/redis/next" alt="NPM version"/></a>
    <a href="https://coveralls.io/github/NodeRedis/node-redis?branch=v4"><img src="https://coveralls.io/repos/github/NodeRedis/node-redis/badge.svg?branch=v4" alt="Coverage Status"/></a>
    <a href="https://discord.gg/XMMVgxUm"><img src="https://img.shields.io/discord/697882427875393627?style=flat-square"/></a>
</p>

---

## Installation

```bash
npm install redis@next
```

## Usage

### Basic Example

```javascript
(async () => {
    const client = require('redis').createClient();

    client.on('error', (err) => console.log('Redis Client Error', err));
    
    await client.connect();

    await client.set('key', 'value');
    const value = await client.get('key');
})();
```

### Redis Commands

There is built-in support for all of the [out-of-the-box Redis commands](https://redis.io/commands). They are exposed using the raw Redis command names (`HGET`, `HSET`, etc.) and a friendlier camel-cased version (`hGet`, `hSet`, etc.).

```javascript
// raw Redis commands
await client.SET('key', 'value');
await client.GET('key');

// friendly JavaScript commands
await client.hSet('key', 'field', 'value');
await client.hGetAll('key');
```

Modifiers to commands are specified using a JavaScript object:

```javascript
await client.set('key', 'value', {
    EX: 10,
    NX: true
});
```

Replies will be transformed to useful data structures:

```javascript
await client.hGetAll('key'); // { key1: 'value1', key2: 'value2' }
await client.hKeys('key'); // ['key1', 'key2']
```

### Unsupported Redis Commands

If you want to run commands and arguments that Node Redis doesn't know about (yet!) you can use `.sendCommand`:

```javascript
await client.sendCommand(['SET', 'key', 'value', 'NX']); // 'OK'

await client.sendCommand(['HGETALL', 'key']); // ['key1', 'field1', 'key2', 'field2']
```

### Blocking Commands

Any command can be run on a new connection by specifying the `duplicateConnection` option. The newly created connection is closed when command's `Promise` is fulfilled.

This pattern works especially well for blocking commands—such as `BLPOP` and `BRPOPLPUSH`:

```javascript
const blPopPromise = client.blPop(
    client.commandOptions({ duplicateConnection: true }),
    'key'
);

await client.lPush('key', ['1', '2']);

await blPopPromise; // '2'
```

### Pub/Sub

Subscribing to a channel requires a dedicated Redis connection and is easily handled using events.

```javascript
await subscriber.subscribe('channel', message => {
    console.log(message); // 'message'
});

await subscriber.pSubscribe('channe*', (message, channel) => {
    console.log(message, channel); // 'message', 'channel'
});

await publisher.publish('channel', 'message');
```

### Lua Scripts

You can define Lua scripts to create efficient custom commands:

```javascript
(async () => {
    const client = require('redis').createClient({
        scripts: {
            add: require('redis/lua-script').defineScript({
                NUMBER_OF_KEYS: 1,
                SCRIPT:
                    'local val = redis.pcall("GET", KEYS[1]);' +
                    'return val + ARGV[1];',
                transformArguments(key: string, toAdd: number): Array<string> {
                    return [key, number.toString()];
                },
                transformReply(reply: number): number {
                    return reply;
                }
            })
        }
    });

    await client.connect();

    await client.set('key', '1');
    await client.add('key', 2); // 3
})();
```

## Contributing

If you'd like to contribute, check out the [contributing guide](CONTRIBUTING.md).

## License

This repository is licensed under the "MIT" license. See [LICENSE](LICENSE).
