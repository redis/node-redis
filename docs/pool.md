# `RedisClientPool`

Sometimes you want to run your commands on an exclusive connection. There are a few reasons to do this:

- You want to run a blocking command that will take over the connection, such as `BLPOP` or `BLMOVE`.
- You're using [transactions](https://redis.io/docs/interact/transactions/) and need to `WATCH` a key or keys for changes.
- Some more...

For those use cases you'll need to create a connection pool.

## Creating a pool

You can create a pool using the `createClientPool` function:

```javascript
import { createClientPool } from 'redis';

const pool = await createClientPool()
  .on('error', err => console.error('Redis Client Pool Error', err));
```

the function accepts two arguments, the client configuration (see [here](./client-configuration.md) for more details), and the pool configuration:

| Property       | Default | Description                                                                                                                    |
|----------------|---------|--------------------------------------------------------------------------------------------------------------------------------|
| minimum        | 1       | The minimum clients the pool should hold to. The pool won't close clients if the pool size is less than the minimum.           |
| maximum        | 100     | The maximum clients the pool will have at once. The pool won't create any more resources and queue requests in memory.         |
| acquireTimeout | 3000    | The maximum time (in ms) a task can wait in the queue. The pool will reject the task with `TimeoutError` in case of a timeout. |
| cleanupDelay   | 3000    | The time to wait before cleaning up unused clients.                                                                            |

You can also create a pool from a client (reusing it's configuration):
```javascript
const pool = await client.createPool()
  .on('error', err => console.error('Redis Client Pool Error', err));
```

## The Simple Scenario

All the client APIs are exposed on the pool instance directly, and will execute the commands using one of the available clients.

```javascript
await pool.sendCommand(['PING']); // 'PONG'
await client.ping(); // 'PONG'
await client.withTypeMapping({
  [RESP_TYPES.SIMPLE_STRING]: Buffer
}).ping(); // Buffer
```

## Transactions

Things get a little more complex with transactions. Here we are `.watch()`ing some keys. If the keys change during the transaction, a `WatchError` is thrown when `.exec()` is called:

```javascript
try {
  await pool.execute(async client => {
    await client.watch('key');

    const multi = client.multi()
      .ping()
      .get('key');

    if (Math.random() > 0.5) {
      await client.watch('another-key');
      multi.set('another-key', await client.get('another-key') / 2);
    }

    return multi.exec();
  });
} catch (err) {
  if (err instanceof WatchError) {
    // the transaction aborted
  }
}
```
