import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import READ, { TS_READ_TIMESTAMP } from './READ';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TS.READ', () => {
  describe('transformArguments', () => {
    it('minimal', () => {
      assert.deepEqual(
        parseArgs(READ, 'key', 0),
        ['TS.READ', 'key', '0']
      );
    });

    it('with sentinel cursor', () => {
      assert.deepEqual(
        parseArgs(READ, 'key', TS_READ_TIMESTAMP.NEW),
        ['TS.READ', 'key', '$']
      );
    });

    it('with MAX_COUNT', () => {
      assert.deepEqual(
        parseArgs(READ, 'key', TS_READ_TIMESTAMP.EARLIEST, {
          MAX_COUNT: 2
        }),
        ['TS.READ', 'key', '-', 'MAX_COUNT', '2']
      );
    });

    it('with BLOCK (default minCount)', () => {
      assert.deepEqual(
        parseArgs(READ, 'key', 0, {
          BLOCK: { milliseconds: 5000 }
        }),
        ['TS.READ', 'key', '0', 'BLOCK', '5000', '1']
      );
    });

    it('with BLOCK and MAX_COUNT', () => {
      assert.deepEqual(
        parseArgs(READ, 'key', TS_READ_TIMESTAMP.NEW, {
          BLOCK: { milliseconds: 0, minCount: 10 },
          MAX_COUNT: 100
        }),
        ['TS.READ', 'key', '$', 'BLOCK', '0', '10', 'MAX_COUNT', '100']
      );
    });
  });

  testUtils.testWithClient('client.ts.read', async client => {
    await client.ts.add('key', 100, 1);
    await client.ts.add('key', 200, 2);
    await client.ts.add('key', 300, 3);

    assert.deepEqual(
      await client.ts.read('key', 0),
      [
        { timestamp: 100, value: 1 },
        { timestamp: 200, value: 2 },
        { timestamp: 300, value: 3 }
      ]
    );
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [8, 10]
  });

  testUtils.testWithClient('client.ts.read with MAX_COUNT', async client => {
    await client.ts.add('key', 100, 1);
    await client.ts.add('key', 200, 2);
    await client.ts.add('key', 300, 3);

    assert.deepEqual(
      await client.ts.read('key', TS_READ_TIMESTAMP.EARLIEST, { MAX_COUNT: 2 }),
      [
        { timestamp: 100, value: 1 },
        { timestamp: 200, value: 2 }
      ]
    );
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [8, 10]
  });

  testUtils.testWithClient('client.ts.read empty on missing key', async client => {
    assert.deepEqual(
      await client.ts.read('missing', 0),
      []
    );
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [8, 10]
  });

  testUtils.testWithClient('client.ts.read with LATEST sentinel', async client => {
    await client.ts.add('key', 100, 1);
    await client.ts.add('key', 200, 2);
    await client.ts.add('key', 300, 3);

    assert.deepEqual(
      await client.ts.read('key', TS_READ_TIMESTAMP.LATEST),
      [{ timestamp: 300, value: 3 }]
    );
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [8, 10]
  });

  testUtils.testWithClient('client.ts.read with BLOCK returns synchronously when minCount is met', async client => {
    await client.ts.add('key', 100, 1);
    await client.ts.add('key', 200, 2);

    assert.deepEqual(
      await client.ts.read('key', 0, {
        BLOCK: { milliseconds: 5000, minCount: 2 }
      }),
      [
        { timestamp: 100, value: 1 },
        { timestamp: 200, value: 2 }
      ]
    );
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [8, 10]
  });

  testUtils.testWithClient('client.ts.read with NEW sentinel and BLOCK flushes empty on timeout', async client => {
    await client.ts.add('key', 100, 1);

    assert.deepEqual(
      await client.ts.read('key', TS_READ_TIMESTAMP.NEW, {
        BLOCK: { milliseconds: 100 }
      }),
      []
    );
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [8, 10]
  });
});
