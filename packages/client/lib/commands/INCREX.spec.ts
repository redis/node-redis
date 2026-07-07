import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import INCREX from './INCREX';
import { parseArgs } from './generic-transformers';
import { RESP_TYPES } from '../RESP/decoder';

describe('INCREX', () => {
  describe('transformArguments', () => {
    it('no options', () => {
      assert.deepEqual(
        parseArgs(INCREX, 'key'),
        ['INCREX', 'key']
      );
    });

    it('BYINT positive', () => {
      assert.deepEqual(
        parseArgs(INCREX, 'key', { by: 5 }),
        ['INCREX', 'key', 'BYINT', '5']
      );
    });

    it('BYINT negative', () => {
      assert.deepEqual(
        parseArgs(INCREX, 'key', { by: -3 }),
        ['INCREX', 'key', 'BYINT', '-3']
      );
    });

    it('BYINT accepts string for values past MAX_SAFE_INTEGER', () => {
      assert.deepEqual(
        parseArgs(INCREX, 'key', { by: '9223372036854775000' }),
        ['INCREX', 'key', 'BYINT', '9223372036854775000']
      );
    });

    it('lowerBound and upperBound accept strings', () => {
      assert.deepEqual(
        parseArgs(INCREX, 'key', {
          lowerBound: '-9223372036854775000',
          upperBound: '9223372036854775000'
        }),
        ['INCREX', 'key', 'LBOUND', '-9223372036854775000', 'UBOUND', '9223372036854775000']
      );
    });

    it('lowerBound', () => {
      assert.deepEqual(
        parseArgs(INCREX, 'key', { lowerBound: -10 }),
        ['INCREX', 'key', 'LBOUND', '-10']
      );
    });

    it('upperBound', () => {
      assert.deepEqual(
        parseArgs(INCREX, 'key', { upperBound: 100 }),
        ['INCREX', 'key', 'UBOUND', '100']
      );
    });

    it('lowerBound and upperBound', () => {
      assert.deepEqual(
        parseArgs(INCREX, 'key', { lowerBound: 0, upperBound: 100 }),
        ['INCREX', 'key', 'LBOUND', '0', 'UBOUND', '100']
      );
    });

    it('saturate true', () => {
      assert.deepEqual(
        parseArgs(INCREX, 'key', { saturate: true }),
        ['INCREX', 'key', 'SATURATE']
      );
    });

    it('saturate false omits flag', () => {
      assert.deepEqual(
        parseArgs(INCREX, 'key', { saturate: false }),
        ['INCREX', 'key']
      );
    });

    it('expiration EX', () => {
      assert.deepEqual(
        parseArgs(INCREX, 'key', { expiration: { type: 'EX', value: 60 } }),
        ['INCREX', 'key', 'EX', '60']
      );
    });

    it('expiration PX', () => {
      assert.deepEqual(
        parseArgs(INCREX, 'key', { expiration: { type: 'PX', value: 60000 } }),
        ['INCREX', 'key', 'PX', '60000']
      );
    });

    it('expiration EXAT', () => {
      assert.deepEqual(
        parseArgs(INCREX, 'key', { expiration: { type: 'EXAT', value: 1700000000 } }),
        ['INCREX', 'key', 'EXAT', '1700000000']
      );
    });

    it('expiration PXAT', () => {
      assert.deepEqual(
        parseArgs(INCREX, 'key', { expiration: { type: 'PXAT', value: 1700000000000 } }),
        ['INCREX', 'key', 'PXAT', '1700000000000']
      );
    });

    it('expiration PERSIST', () => {
      assert.deepEqual(
        parseArgs(INCREX, 'key', { expiration: { type: 'PERSIST' } }),
        ['INCREX', 'key', 'PERSIST']
      );
    });

    it('expiration EX with ENX', () => {
      assert.deepEqual(
        parseArgs(INCREX, 'key', { expiration: { type: 'EX', value: 60, ENX: true } }),
        ['INCREX', 'key', 'EX', '60', 'ENX']
      );
    });

    it('all options together (rate-limiter pattern)', () => {
      assert.deepEqual(
        parseArgs(INCREX, 'ratelimit:user', {
          by: 1,
          upperBound: 100,
          expiration: { type: 'EX', value: 60, ENX: true }
        }),
        ['INCREX', 'ratelimit:user', 'BYINT', '1', 'UBOUND', '100', 'EX', '60', 'ENX']
      );
    });
  });

  testUtils.testAll('increx default increments by 1', async client => {
    assert.deepEqual(
      await client.increx('key'),
      [1, 1]
    );
  }, {
    client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 8] },
    cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 8] }
  });

  testUtils.testAll('increx BYINT positive', async client => {
    await client.set('key', '100');
    assert.deepEqual(
      await client.increx('key', { by: 5 }),
      [105, 5]
    );
  }, {
    client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 8] },
    cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 8] }
  });

  testUtils.testAll('increx BYINT negative', async client => {
    await client.set('key', '100');
    assert.deepEqual(
      await client.increx('key', { by: -10 }),
      [90, -10]
    );
  }, {
    client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 8] },
    cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 8] }
  });

  testUtils.testAll('increx SATURATE saturates at upper bound', async client => {
    await client.set('key', '99');
    assert.deepEqual(
      await client.increx('key', {
        by: 5,
        upperBound: 100,
        saturate: true
      }),
      [100, 1]
    );
  }, {
    client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 8] },
    cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 8] }
  });

  testUtils.testAll('increx default (no saturate) leaves value unchanged when out of bounds', async client => {
    await client.set('key', '99');
    assert.deepEqual(
      await client.increx('key', {
        by: 5,
        upperBound: 100
      }),
      [99, 0]
    );
  }, {
    client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 8] },
    cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 8] }
  });

  testUtils.testAll('increx EX sets TTL', async client => {
    await client.increx('key', {
      by: 1,
      expiration: { type: 'EX', value: 100 }
    });
    const ttl = await client.ttl('key');
    assert.ok(ttl > 0 && ttl <= 100);
  }, {
    client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 8] },
    cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 8] }
  });

  testUtils.testAll('increx ENX does not overwrite existing TTL', async client => {
    await client.set('key', '10', { expiration: { type: 'EX', value: 500 } });
    await client.increx('key', {
      by: 1,
      expiration: { type: 'EX', value: 10, ENX: true }
    });
    const ttl = await client.ttl('key');
    assert.ok(ttl > 10, `expected TTL to remain near 500, got ${ttl}`);
  }, {
    client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 8] },
    cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 8] }
  });

  testUtils.testAll('increx PERSIST removes TTL', async client => {
    await client.set('key', '5', { expiration: { type: 'EX', value: 1000 } });
    await client.increx('key', {
      by: 1,
      expiration: { type: 'PERSIST' }
    });
    assert.equal(await client.ttl('key'), -1);
  }, {
    client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 8] },
    cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 8] }
  });

  // The reply is always `[NumberReply, NumberReply]`. `NUMBER:String` opts the
  // user into precision-safe string output via the decoder itself.
  describe('type mappings', () => {
    for (const resp of [2, 3] as const) {
      testUtils.testWithClient(`RESP${resp} default returns JS numbers`, async client => {
        await client.sendCommand(['DEL', 'k']);
        await client.sendCommand(['SET', 'k', '100']);
        const reply = await client.increx('k', { by: 5 });
        assert.equal(typeof reply[0], 'number');
        assert.equal(typeof reply[1], 'number');
        assert.deepEqual(reply, [105, 5]);
      }, {
        ...GLOBAL.SERVERS.OPEN,
        minimumDockerVersion: [8, 8],
        clientOptions: { RESP: resp }
      });

      testUtils.testWithClient(`RESP${resp} NUMBER:String returns precision-safe strings`, async client => {
        const seed = '9223372036854775000';
        await client.sendCommand(['DEL', 'k']);
        await client.sendCommand(['SET', 'k', seed]);

        const reply = await client
          .withTypeMapping({ [RESP_TYPES.NUMBER]: String })
          .increx('k', { by: '100' });

        assert.equal(typeof reply[0], 'string');
        assert.equal(reply[0], '9223372036854775100');
        assert.equal(reply[1], '100');
      }, {
        ...GLOBAL.SERVERS.OPEN,
        minimumDockerVersion: [8, 8],
        clientOptions: { RESP: resp }
      });
    }
  });
});
