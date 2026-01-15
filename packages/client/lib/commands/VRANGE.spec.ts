import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import VRANGE from './VRANGE';
import { BasicCommandParser } from '../client/parser';

describe('VRANGE', () => {
  describe('parseCommand', () => {
    it('without count', () => {
      const parser = new BasicCommandParser();
      VRANGE.parseCommand(parser, 'key', '-', '+');
      assert.deepEqual(
        parser.redisArgs,
        ['VRANGE', 'key', '-', '+']
      );
    });

    it('with count', () => {
      const parser = new BasicCommandParser();
      VRANGE.parseCommand(parser, 'key', '-', '+', 10);
      assert.deepEqual(
        parser.redisArgs,
        ['VRANGE', 'key', '-', '+', '10']
      );
    });

    it('with inclusive start', () => {
      const parser = new BasicCommandParser();
      VRANGE.parseCommand(parser, 'key', '[abc', '+', 5);
      assert.deepEqual(
        parser.redisArgs,
        ['VRANGE', 'key', '[abc', '+', '5']
      );
    });

    it('with exclusive start', () => {
      const parser = new BasicCommandParser();
      VRANGE.parseCommand(parser, 'key', '(abc', '+', 5);
      assert.deepEqual(
        parser.redisArgs,
        ['VRANGE', 'key', '(abc', '+', '5']
      );
    });

    it('with negative count (return all)', () => {
      const parser = new BasicCommandParser();
      VRANGE.parseCommand(parser, 'key', '-', '+', -1);
      assert.deepEqual(
        parser.redisArgs,
        ['VRANGE', 'key', '-', '+', '-1']
      );
    });
  });

  describe('RESP2 tests', () => {
    testUtils.testAll('vRange - returns all elements with - +', async client => {
      await client.vAdd('key', [1.0, 2.0, 3.0], 'alpha');
      await client.vAdd('key', [4.0, 5.0, 6.0], 'beta');
      await client.vAdd('key', [7.0, 8.0, 9.0], 'gamma');

      const result = await client.vRange('key', '-', '+');
      assert.ok(Array.isArray(result));
      assert.equal(result.length, 3);
      // Results should be in lexicographical order
      assert.deepEqual(result, ['alpha', 'beta', 'gamma']);
    }, {
      client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 4] },
      cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 4] }
    });

    testUtils.testAll('vRange - with count limit', async client => {
      await client.vAdd('key', [1.0, 2.0, 3.0], 'alpha');
      await client.vAdd('key', [4.0, 5.0, 6.0], 'beta');
      await client.vAdd('key', [7.0, 8.0, 9.0], 'gamma');

      const result = await client.vRange('key', '-', '+', 2);
      assert.ok(Array.isArray(result));
      assert.equal(result.length, 2);
      assert.deepEqual(result, ['alpha', 'beta']);
    }, {
      client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 4] },
      cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 4] }
    });

    testUtils.testAll('vRange - with inclusive start', async client => {
      await client.vAdd('key', [1.0, 2.0, 3.0], 'alpha');
      await client.vAdd('key', [4.0, 5.0, 6.0], 'beta');
      await client.vAdd('key', [7.0, 8.0, 9.0], 'gamma');

      const result = await client.vRange('key', '[beta', '+');
      assert.ok(Array.isArray(result));
      assert.equal(result.length, 2);
      assert.deepEqual(result, ['beta', 'gamma']);
    }, {
      client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 4] },
      cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 4] }
    });

    testUtils.testAll('vRange - with exclusive start', async client => {
      await client.vAdd('key', [1.0, 2.0, 3.0], 'alpha');
      await client.vAdd('key', [4.0, 5.0, 6.0], 'beta');
      await client.vAdd('key', [7.0, 8.0, 9.0], 'gamma');

      const result = await client.vRange('key', '(alpha', '+');
      assert.ok(Array.isArray(result));
      assert.equal(result.length, 2);
      assert.deepEqual(result, ['beta', 'gamma']);
    }, {
      client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 4] },
      cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 4] }
    });

    testUtils.testAll('vRange - on non-existent key returns empty array', async client => {
      const result = await client.vRange('nonexistent', '-', '+');
      assert.ok(Array.isArray(result));
      assert.equal(result.length, 0);
    }, {
      client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 4] },
      cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 4] }
    });

    testUtils.testAll('vRange - stateless iterator pattern', async client => {
      // VRANGE is a "stateless iterator" - unlike SCAN which uses a cursor,
      // VRANGE uses the last returned element as the starting point for the next call.
      // The client controls iteration state, not the server.
      await client.vAdd('key', [1.0, 2.0, 3.0], 'a1');
      await client.vAdd('key', [4.0, 5.0, 6.0], 'a2');
      await client.vAdd('key', [7.0, 8.0, 9.0], 'a3');
      await client.vAdd('key', [1.0, 1.0, 1.0], 'b1');
      await client.vAdd('key', [2.0, 2.0, 2.0], 'b2');

      // First batch: start from minimum (-), get 2 elements
      const batch1 = await client.vRange('key', '-', '+', 2);
      assert.deepEqual(batch1, ['a1', 'a2']);

      // Second batch: use last element with exclusive prefix '(' to continue
      // No cursor needed - the element name itself is the "cursor"
      const lastFromBatch1 = batch1[batch1.length - 1];
      const batch2 = await client.vRange('key', `(${lastFromBatch1}`, '+', 2);
      assert.deepEqual(batch2, ['a3', 'b1']);

      // Third batch: continue from last element of batch2
      const lastFromBatch2 = batch2[batch2.length - 1];
      const batch3 = await client.vRange('key', `(${lastFromBatch2}`, '+', 2);
      assert.deepEqual(batch3, ['b2']);

      // Verify we've seen all elements exactly once
      const allElements = [...batch1, ...batch2, ...batch3];
      assert.deepEqual(allElements, ['a1', 'a2', 'a3', 'b1', 'b2']);
    }, {
      client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 4] },
      cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 4] }
    });
  });

  describe('RESP3 tests', () => {
    testUtils.testWithClient('vRange - returns all elements with - +', async client => {
      await client.vAdd('resp3-key', [1.0, 2.0, 3.0], 'alpha');
      await client.vAdd('resp3-key', [4.0, 5.0, 6.0], 'beta');
      await client.vAdd('resp3-key', [7.0, 8.0, 9.0], 'gamma');

      const result = await client.vRange('resp3-key', '-', '+');
      assert.ok(Array.isArray(result));
      assert.equal(result.length, 3);
      assert.deepEqual(result, ['alpha', 'beta', 'gamma']);
    }, {
      ...GLOBAL.SERVERS.OPEN,
      clientOptions: {
        RESP: 3
      },
      minimumDockerVersion: [8, 4]
    });

    testUtils.testWithClient('vRange - with count limit', async client => {
      await client.vAdd('resp3-key', [1.0, 2.0, 3.0], 'alpha');
      await client.vAdd('resp3-key', [4.0, 5.0, 6.0], 'beta');
      await client.vAdd('resp3-key', [7.0, 8.0, 9.0], 'gamma');

      const result = await client.vRange('resp3-key', '-', '+', 2);
      assert.ok(Array.isArray(result));
      assert.equal(result.length, 2);
      assert.deepEqual(result, ['alpha', 'beta']);
    }, {
      ...GLOBAL.SERVERS.OPEN,
      clientOptions: {
        RESP: 3
      },
      minimumDockerVersion: [8, 4]
    });

    testUtils.testWithClient('vRange - with exclusive start for pagination', async client => {
      await client.vAdd('resp3-key', [1.0, 2.0, 3.0], 'item1');
      await client.vAdd('resp3-key', [4.0, 5.0, 6.0], 'item2');
      await client.vAdd('resp3-key', [7.0, 8.0, 9.0], 'item3');

      const result = await client.vRange('resp3-key', '(item1', '+');
      assert.ok(Array.isArray(result));
      assert.equal(result.length, 2);
      assert.deepEqual(result, ['item2', 'item3']);
    }, {
      ...GLOBAL.SERVERS.OPEN,
      clientOptions: {
        RESP: 3
      },
      minimumDockerVersion: [8, 4]
    });

    testUtils.testWithClient('vRange - on non-existent key returns empty array', async client => {
      const result = await client.vRange('resp3-nonexistent', '-', '+');
      assert.ok(Array.isArray(result));
      assert.equal(result.length, 0);
    }, {
      ...GLOBAL.SERVERS.OPEN,
      clientOptions: {
        RESP: 3
      },
      minimumDockerVersion: [8, 4]
    });
  });
});
