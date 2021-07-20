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
    <a href="https://www.npmjs.com/package/redis/v/next"><img src="https://img.shields.io/npm/dm/redis.svg" alt="NPM downloads"/></a>
    <a href="https://www.npmjs.com/package/redis/v/next"><img src="https://img.shields.io/npm/v/redis/next" alt="NPM version"/></a>
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

```typescript
import { createClient } from 'redis';

(async () => {
    const client = createClient();

    client.on('error', (err) => console.log('Redis Client Error', err));

    await client.connect();

    await client.set('key', 'value');
    const value = await client.get('key');
})();
```

The new interface is clean and cool, but if you have an existing code base, you might want to enable [legacy mode](#legacy-mode).

### Redis Commands

There is built-in support for all of the [out-of-the-box Redis commands](https://redis.io/commands). They are exposed using the raw Redis command names (`HGET`, `HSET`, etc.) and a friendlier camel-cased version (`hGet`, `hSet`, etc.):

```typescript
// raw Redis commands
await client.SET('key', 'value');
await client.GET('key');

// friendly JavaScript commands
await client.hSet('key', 'field', 'value');
await client.hGetAll('key');
```

Modifiers to commands are specified using a JavaScript object:

```typescript
await client.set('key', 'value', {
    EX: 10,
    NX: true
});
```

Replies will be transformed to useful data structures:

```typescript
await client.hGetAll('key'); // { key1: 'value1', key2: 'value2' }
await client.hKeys('key'); // ['key1', 'key2']
```

### Unsupported Redis Commands

If you want to run commands and arguments that Node Redis doesn't know about (yet!) you can use `.sendCommand`:

```typescript
await client.sendCommand(['SET', 'key', 'value', 'NX']); // 'OK'

await client.sendCommand(['HGETALL', 'key']); // ['key1', 'field1', 'key2', 'field2']
```

### Transactions (Multi/Exec)

Start [transactions](https://redis.io/topics/transactions) with a call to `.multi()` and then chain your commands. At the end call `.exec()` and you'll get an array back with the results of your commands:

```typescript
const [ setKeyReply, otherKeyValue ] = await client.multi()
    .set('key', 'value')
    .get('other-key')
    .exec()
]); // ['OK', null]
```

You can also watch keys by calling `.watch()`. If someone else changes them out from underneath you, your transaction will abort:

```typescript
await client.watch('other-key');
try {
    await client.multi()
        .set('key', 'value')
        .get('other-key')
        .exec()
    ]);
} catch (err) {
    // ...
}
```

### Blocking Commands

Any command can be run on a new connection by specifying the `duplicateConnection` option. The newly created connection is closed when the command's `Promise` is fulfilled.

This pattern works especially well for blocking commands—such as `BLPOP` and `BLMOVE`:

```typescript
const blPopPromise = client.blPop(
    client.commandOptions({ duplicateConnection: true }),
    'key'
);

await client.lPush('key', ['1', '2']);

await blPopPromise; // '2'
```

### Pub/Sub

Subscribing to a channel requires a dedicated Redis connection and is easily handled using events:

```typescript
await subscriber.subscribe('channel', message => {
    console.log(message); // 'message'
});

await subscriber.pSubscribe('channe*', (message, channel) => {
    console.log(message, channel); // 'message', 'channel'
});

await publisher.publish('channel', 'message');
```

### Scan Iterator

[`SCAN`](https://redis.io/commands/scan) can easily be looped over using [async iterators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/asyncIterator):

```typescript
for await (const key of client.scanIterator()) {
    // use the key!
    await client.get(key);
}
```

This works with HSCAN, SSCAN, and ZSCAN too:

```typescript
for await (const member of client.hScanIterator('hash')) {}
for await (const { field, value } of client.sScanIterator('set')) {}
for await (const { member, score } of client.zScanIterator('sorted-set')) {}
```

You can override the default options by just passing them in:

```typescript
client.scanIterator({
    TYPE: 'string', // `SCAN` only
    MATCH: 'patter*',
    COUNT: 100
});
```

### Lua Scripts

You can define Lua scripts to create efficient custom commands:

```typescript
import { createClient } from 'redis';
import { defineScript } from 'redis/dist/lib/lua-script';

(async () => {
    const client = createClient({
        scripts: {
            add: defineScript({
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

### Cluster

Connecting to a cluster is a bit different. Create the client by specifying the root nodes in your cluster and then use it like a non-clustered client:

```typescript
import { createCluster } from 'redis';

(async () => {
    const cluster = createCluster({
        rootNodes: [{
            host: '192.168.1.1',
            port: 30001
        }, {
            host: '192.168.1.2',
            port: 30002
        }]
    });

    cluster.on('error', (err) => console.log('Redis Cluster Error', err));

    await cluster.connect();

    await cluster.set('key', 'value');
    const value = await cluster.get('key');
})();
```

### Legacy Mode

Need to use the new client in an existing codebase? You can use legacy mode to preserve backwards compatibility while still getting access to the updated experience:

```typescript
const client = createClient({
    legacyMode: true
});

// legacy mode
client.set('key', 'value', 'NX', (err, reply) => {
    // ...
});

// version 4 interface is still accessible
await client.v4.set('key', 'value', {
    NX: true
});
```

## Contributing

If you'd like to contribute, check out the [contributing guide](CONTRIBUTING.md).

## License

This repository is licensed under the "MIT" license. See [LICENSE](LICENSE).
