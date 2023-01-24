# PubSub

Both `RedisClient` and `RedisCluster` supports the PubSub API.

## Using with `RedisClient`

PubSub requires a dedicated stand-alone client. You can easily get one by `.duplicate()`ing an existing `RedisClient`:

```typescript
const subscriber = client.duplicate();
subscribe.on('error', err => console.error(err));
await subscriber.connect();
```

This is done automatically with `RedisCluster`.

### `sharded-channel-moved` event

`RedisClient` emits the `sharded-channel-moved` event when that the ["cluster slot"](https://redis.io/docs/reference/cluster-spec/#key-distribution-model) of a subscribed [Sharded PubSub](https://redis.io/docs/manual/pubsub/#sharded-pubsub) channel has been moved.

The event listener signature is as follows: `(channel: string, listeners: { buffers: Set>, strings: Set> })`.

## Subscribing

```javascript
const listener = message => console.log(message);

await client.subscribe('channel', listener);
await client.pSubscribe('channe*', listener);
await client.sSubscribe('channel', listener);
```

## Publishing

```javascript
await client.publish('channel', 'message');
await client.sPublish('channel', 'message');
```

## Unsubscribing

```javascript
await client.unsubscribe();
await client.pUnsubscribe();
await client.sUnsubscribe();
```

the code above unsubscribes all listeners from all channels, to unsubscribe specific channels:

```javascript
await client.unsubscribe('channel');
await client.unsubscribe(['1', '2']);
```

or just a specific listener:

```javascript
await client.unsubscribe('channel', listener);
```

## Buffers

Publishing and subscribing using `Buffer`s:

```javascript
await subscriber.subscribe('channel', message => {
  console.log(message); // <Buffer 6d 65 73 73 61 67 65>
}, true);

await subscriber.publish(Buffer.from('channel'), Buffer.from('message'));
```

> NOTE: mixing buffers and strings in `publish` is supported. Subscribing in "Buffer mode" and publishing string or vice versa works too.
