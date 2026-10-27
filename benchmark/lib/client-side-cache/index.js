import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { createClient } from 'redis-local';

export const { command, size, fields, miss } = yargs(hideBin(process.argv))
  .option('command', {
    choices: ['get', 'hgetall'],
    default: 'get'
  })
  .option('size', {
    type: 'number',
    default: 16,
    describe: 'bytes per value'
  })
  .option('fields', {
    type: 'number',
    default: 1000,
    describe: 'fields in the hash read by hgetall'
  })
  .option('miss', {
    type: 'boolean',
    default: false,
    describe: 'read a different key each time, from a cache that holds one entry, so every read misses'
  })
  .parseSync();

// more keys than the runner's concurrency, so concurrent reads don't share a load
const MISS_KEYS = 1000;

export async function createCachedClient(host, { command, size, fields, miss }, clientOptions) {
  const client = createClient({
    ...clientOptions,
    socket: {
      host
    },
    RESP: 3,
    clientSideCache: {
      ttl: 0,
      maxEntries: miss ? 1 : 0
    }
  });

  await client.connect();

  const keys = Array.from({ length: miss ? MISS_KEYS : 1 }, (_, i) => `client-side-cache:${command}:${i}`),
    value = 'x'.repeat(size);

  for (const key of keys) {
    if (command === 'get') {
      await client.set(key, value);
    } else {
      const hash = {};
      for (let i = 0; i < fields; i++) {
        hash[`field:${i}`] = value;
      }
      await client.hSet(key, hash);
    }
  }

  let i = 0;
  return {
    benchmark() {
      const key = keys[i++ % keys.length];
      return command === 'get' ? client.get(key) : client.hGetAll(key);
    },
    async teardown() {
      await client.del(keys);
      await client.close();
    }
  };
}
