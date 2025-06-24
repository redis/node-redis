import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import VRANDMEMBER from './VRANDMEMBER';
import { BasicCommandParser } from '../client/parser';

describe('VRANDMEMBER', () => {
  describe('parseCommand', () => {
    it('without count', () => {
      const parser = new BasicCommandParser();
      VRANDMEMBER.parseCommand(parser, 'key');
      assert.deepEqual(
        parser.redisArgs,
        ['VRANDMEMBER', 'key']
      );
    });

    it('with count', () => {
      const parser = new BasicCommandParser();
      VRANDMEMBER.parseCommand(parser, 'key', 2);
      assert.deepEqual(
        parser.redisArgs,
        ['VRANDMEMBER', 'key', '2']
      );
    });
  });

  describe('RESP2 tests', () => {
    testUtils.testAll('vRandMember without count - returns single element as string', async client => {
      await client.vAdd('key', [1.0, 2.0, 3.0], 'element1');
      await client.vAdd('key', [4.0, 5.0, 6.0], 'element2');
      await client.vAdd('key', [7.0, 8.0, 9.0], 'element3');

      const result = await client.vRandMember('key');
      assert.equal(typeof result, 'string');
      assert.ok(['element1', 'element2', 'element3'].includes(result as string));
    }, {
      client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 0] },
      cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 0] }
    });

    testUtils.testAll('vRandMember with positive count - returns distinct elements', async client => {
      await client.vAdd('key', [1.0, 2.0, 3.0], 'element1');
      await client.vAdd('key', [4.0, 5.0, 6.0], 'element2');
      await client.vAdd('key', [7.0, 8.0, 9.0], 'element3');

      const result = await client.vRandMember('key', 2);
      assert.ok(Array.isArray(result));
      assert.equal(result.length, 2);

    }, {
      client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 0] },
      cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 0] }
    });

    testUtils.testAll('vRandMember with negative count - allows duplicates', async client => {
      await client.vAdd('key', [1.0, 2.0, 3.0], 'element1');
      await client.vAdd('key', [4.0, 5.0, 6.0], 'element2');

      const result = await client.vRandMember('key', -5);
      assert.ok(Array.isArray(result));
      assert.equal(result.length, 5);

      // All elements should be from our set (duplicates allowed)
      result.forEach(element => {
        assert.ok(['element1', 'element2'].includes(element));
      });
    }, {
      client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 0] },
      cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 0] }
    });

    testUtils.testAll('vRandMember count exceeds set size - returns entire set', async client => {
      await client.vAdd('key', [1.0, 2.0, 3.0], 'element1');
      await client.vAdd('key', [4.0, 5.0, 6.0], 'element2');

      const result = await client.vRandMember('key', 10);
      assert.ok(Array.isArray(result));
      assert.equal(result.length, 2); // Only 2 elements exist

      // Should contain both elements
      assert.ok(result.includes('element1'));
      assert.ok(result.includes('element2'));
    }, {
      client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 0] },
      cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 0] }
    });

    testUtils.testAll('vRandMember on non-existent key', async client => {
      // Without count - should return null
      const resultNoCount = await client.vRandMember('nonexistent');
      assert.equal(resultNoCount, null);

      // With count - should return empty array
      const resultWithCount = await client.vRandMember('nonexistent', 5);
      assert.ok(Array.isArray(resultWithCount));
      assert.equal(resultWithCount.length, 0);
    }, {
      client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 0] },
      cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 0] }
    });
  });

  describe('RESP3 tests', () => {
    testUtils.testWithClient('vRandMember without count - returns single element as string', async client => {
      await client.vAdd('resp3-key', [1.0, 2.0, 3.0], 'element1');
      await client.vAdd('resp3-key', [4.0, 5.0, 6.0], 'element2');
      await client.vAdd('resp3-key', [7.0, 8.0, 9.0], 'element3');

      const result = await client.vRandMember('resp3-key');
      assert.equal(typeof result, 'string');
      assert.ok(['element1', 'element2', 'element3'].includes(result as string));
    }, {
      ...GLOBAL.SERVERS.OPEN,
      clientOptions: {
        RESP: 3
      },
      minimumDockerVersion: [8, 0]
    });

    testUtils.testWithClient('vRandMember with positive count - returns distinct elements', async client => {
      await client.vAdd('resp3-key', [1.0, 2.0, 3.0], 'element1');
      await client.vAdd('resp3-key', [4.0, 5.0, 6.0], 'element2');
      await client.vAdd('resp3-key', [7.0, 8.0, 9.0], 'element3');

      const result = await client.vRandMember('resp3-key', 2);
      assert.ok(Array.isArray(result));
      assert.equal(result.length, 2);

      // Should be distinct elements (no duplicates)
      const uniqueElements = new Set(result);
      assert.equal(uniqueElements.size, 2);

      // All elements should be from our set
      result.forEach(element => {
        assert.ok(['element1', 'element2', 'element3'].includes(element));
      });
    }, {
      ...GLOBAL.SERVERS.OPEN,
      clientOptions: {
        RESP: 3
      },
      minimumDockerVersion: [8, 0]
    });

    testUtils.testWithClient('vRandMember with negative count - allows duplicates', async client => {
      await client.vAdd('resp3-key', [1.0, 2.0, 3.0], 'element1');
      await client.vAdd('resp3-key', [4.0, 5.0, 6.0], 'element2');

      const result = await client.vRandMember('resp3-key', -5);
      assert.ok(Array.isArray(result));
      assert.equal(result.length, 5);

      // All elements should be from our set (duplicates allowed)
      result.forEach(element => {
        assert.ok(['element1', 'element2'].includes(element));
      });
    }, {
      ...GLOBAL.SERVERS.OPEN,
      clientOptions: {
        RESP: 3
      },
      minimumDockerVersion: [8, 0]
    });

    testUtils.testWithClient('vRandMember count exceeds set size - returns entire set', async client => {
      await client.vAdd('resp3-key', [1.0, 2.0, 3.0], 'element1');
      await client.vAdd('resp3-key', [4.0, 5.0, 6.0], 'element2');

      const result = await client.vRandMember('resp3-key', 10);
      assert.ok(Array.isArray(result));
      assert.equal(result.length, 2); // Only 2 elements exist

      // Should contain both elements
      assert.ok(result.includes('element1'));
      assert.ok(result.includes('element2'));
    }, {
      ...GLOBAL.SERVERS.OPEN,
      clientOptions: {
        RESP: 3
      },
      minimumDockerVersion: [8, 0]
    });

    testUtils.testWithClient('vRandMember on non-existent key', async client => {
      // Without count - should return null
      const resultNoCount = await client.vRandMember('resp3-nonexistent');
      assert.equal(resultNoCount, null);

      // With count - should return empty array
      const resultWithCount = await client.vRandMember('resp3-nonexistent', 5);
      assert.ok(Array.isArray(resultWithCount));
      assert.equal(resultWithCount.length, 0);
    }, {
      ...GLOBAL.SERVERS.OPEN,
      clientOptions: {
        RESP: 3
      },
      minimumDockerVersion: [8, 0]
    });
  });
});
