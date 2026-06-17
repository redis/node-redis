import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';

const PREFIX = 'test-prefix:';

/**
 * End-to-end coverage for the `keyPrefix` option. Because replies are NOT un-prefixed
 * (ioredis parity), `KEYS *` reveals the raw keys stored on the server and is used here
 * to assert that the prefix was actually applied on the wire.
 */
describe('keyPrefix', () => {
  const OPTIONS = {
    ...GLOBAL.SERVERS.OPEN,
    clientOptions: { keyPrefix: PREFIX }
  };

  testUtils.testWithClient('prefixes keys sent to the server and round-trips transparently', async client => {
    await client.set('key', 'value');

    // the value is readable through the (prefixed) client
    assert.equal(await client.get('key'), 'value');
    // ...and the key is actually stored prefixed on the server
    assert.deepEqual(await client.keys('*'), [`${PREFIX}key`]);
  }, OPTIONS);

  testUtils.testWithClient('does not un-prefix keys returned by the server', async client => {
    await client.set('key', 'value');
    const keys = await client.keys('*');
    // ioredis parity: returned keys keep the prefix
    assert.deepEqual(keys, [`${PREFIX}key`]);
    assert.notDeepEqual(keys, ['key']);
  }, OPTIONS);

  testUtils.testWithClient('prefixes every key of a multi-key command', async client => {
    await client.mSet([['a', '1'], ['b', '2']]);

    assert.deepEqual(await client.mGet(['a', 'b']), ['1', '2']);
    assert.deepEqual((await client.keys('*')).sort(), [`${PREFIX}a`, `${PREFIX}b`]);

    assert.equal(await client.del(['a', 'b']), 2);
  }, OPTIONS);

  testUtils.testWithClient('prefixes both keys of a two-key command (COPY)', async client => {
    await client.set('source', 'value');
    await client.copy('source', 'destination');

    assert.equal(await client.get('destination'), 'value');
    assert.deepEqual((await client.keys('*')).sort(), [`${PREFIX}destination`, `${PREFIX}source`]);
  }, OPTIONS);

  testUtils.testWithClient('prefixes keys inside a transaction (MULTI/EXEC)', async client => {
    const replies = await client.multi()
      .set('key', 'value')
      .get('key')
      .exec();

    assert.deepEqual(replies, ['OK', 'value']);
    assert.deepEqual(await client.keys('*'), [`${PREFIX}key`]);
  }, OPTIONS);

  testUtils.testWithClient('prefixes the key of APPEND (regression for push vs pushKey)', async client => {
    await client.append('key', 'foo');
    await client.append('key', 'bar');

    assert.equal(await client.get('key'), 'foobar');
    assert.deepEqual(await client.keys('*'), [`${PREFIX}key`]);
  }, OPTIONS);

  testUtils.testWithClient('prefixes the STORE destination of SORT', async client => {
    await client.rPush('list', ['3', '1', '2']);
    await client.sortStore('list', 'sorted');

    assert.deepEqual(await client.lRange('sorted', 0, -1), ['1', '2', '3']);
    assert.deepEqual((await client.keys('*')).sort(), [`${PREFIX}list`, `${PREFIX}sorted`]);
  }, OPTIONS);

  testUtils.testWithClient('prefixes the KEYS of a script while keeping numkeys correct', async client => {
    await client.eval(
      "redis.call('SET', KEYS[1], ARGV[1]); return 1",
      {
        keys: ['key'],
        arguments: ['value']
      }
    );

    assert.equal(await client.get('key'), 'value');
    assert.deepEqual(await client.keys('*'), [`${PREFIX}key`]);
  }, OPTIONS);

  testUtils.testWithClient('does not prefix Pub/Sub channels', async publisher => {
    const subscriber = publisher.duplicate();
    await subscriber.connect();

    try {
      let resolve!: (msg: string) => void;
      const received = new Promise<string>(r => { resolve = r; });

      await subscriber.subscribe('channel', message => resolve(message));
      await publisher.publish('channel', 'hello');

      assert.equal(await received, 'hello');
    } finally {
      subscriber.destroy();
    }
  }, OPTIONS);

  testUtils.testWithClientPool('applies keyPrefix to commands sent through a pool', async pool => {
    await pool.set('key', 'value');

    assert.equal(await pool.get('key'), 'value');
    assert.deepEqual(await pool.keys('*'), [`${PREFIX}key`]);
  }, {
    ...GLOBAL.SERVERS.OPEN,
    clientOptions: { keyPrefix: PREFIX }
  });

  testUtils.testWithClientPool('applies keyPrefix inside a pool transaction', async pool => {
    const replies = await pool.multi()
      .set('key', 'value')
      .get('key')
      .exec();

    assert.deepEqual(replies, ['OK', 'value']);
    assert.deepEqual(await pool.keys('*'), [`${PREFIX}key`]);
  }, {
    ...GLOBAL.SERVERS.OPEN,
    clientOptions: { keyPrefix: PREFIX }
  });

  testUtils.testWithCluster('applies keyPrefix and routes on the prefixed key', async cluster => {
    await cluster.set('key', 'value');
    assert.equal(await cluster.get('key'), 'value');

    // Node clients are not prefixed, so reading them back reveals the raw stored key,
    // proving the cluster applied the prefix and routed to the slot of the prefixed key.
    const stored: Array<string> = [];
    for (const master of cluster.masters) {
      const node = await cluster.nodeClient(master);
      stored.push(...(await node.keys('*')) as Array<string>);
    }
    assert.deepEqual(stored, [`${PREFIX}key`]);

    assert.equal(await cluster.del('key'), 1);
  }, {
    ...GLOBAL.CLUSTERS.OPEN,
    clusterConfiguration: { keyPrefix: PREFIX }
  });

  testUtils.testWithCluster('applies keyPrefix inside a cluster transaction', async cluster => {
    const replies = await cluster.multi()
      .set('key', 'value')
      .get('key')
      .exec();

    assert.deepEqual(replies, ['OK', 'value']);
  }, {
    ...GLOBAL.CLUSTERS.OPEN,
    clusterConfiguration: { keyPrefix: PREFIX }
  });

  testUtils.testWithClientSentinel('applies keyPrefix to commands sent through sentinel', async sentinel => {
    await sentinel.set('key', 'value');

    assert.equal(await sentinel.get('key'), 'value');
    assert.deepEqual(await sentinel.keys('*'), [`${PREFIX}key`]);

    // transactions go through a separate multi-command path
    const replies = await sentinel.multi()
      .get('key')
      .exec();
    assert.deepEqual(replies, ['value']);
  }, {
    ...GLOBAL.SENTINEL.OPEN,
    sentinelOptions: { keyPrefix: PREFIX }
  });
});
