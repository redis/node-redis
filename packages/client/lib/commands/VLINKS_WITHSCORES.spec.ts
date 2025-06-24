import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import VLINKS_WITHSCORES from './VLINKS_WITHSCORES';
import { BasicCommandParser } from '../client/parser';

describe('VLINKS WITHSCORES', () => {
  it('parseCommand', () => {
    const parser = new BasicCommandParser();
    VLINKS_WITHSCORES.parseCommand(parser, 'key', 'element');
    assert.deepEqual(parser.redisArgs, [
      'VLINKS',
      'key',
      'element',
      'WITHSCORES'
    ]);
  });

  testUtils.testAll(
    'vLinksWithScores',
    async client => {
      // Create a vector set with multiple elements to build HNSW graph layers
      await client.vAdd('key', [1.0, 2.0, 3.0], 'element1');
      await client.vAdd('key', [1.1, 2.1, 3.1], 'element2');
      await client.vAdd('key', [1.2, 2.2, 3.2], 'element3');
      await client.vAdd('key', [2.0, 3.0, 4.0], 'element4');

      const result = await client.vLinksWithScores('key', 'element1');

      assert.ok(Array.isArray(result));

      for (const layer of result) {
        assert.equal(
          typeof layer,
          'object'
        );
      }

      assert.ok(result.length >= 1, 'Should have at least layer 0');
    },
    {
      client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 0] },
      cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 0] }
    }
  );

  testUtils.testWithClient(
    'vLinksWithScores with RESP3',
    async client => {
      await client.vAdd('resp3-key', [1.0, 2.0, 3.0], 'element1');
      await client.vAdd('resp3-key', [1.1, 2.1, 3.1], 'element2');
      await client.vAdd('resp3-key', [1.2, 2.2, 3.2], 'element3');
      await client.vAdd('resp3-key', [2.0, 3.0, 4.0], 'element4');

      const result = await client.vLinksWithScores('resp3-key', 'element1');

      assert.ok(Array.isArray(result));

      for (const layer of result) {
        assert.equal(
          typeof layer,
          'object'
        );
      }

      assert.ok(result.length >= 1, 'Should have at least layer 0');
    },
    {
      ...GLOBAL.SERVERS.OPEN,
      clientOptions: {
        RESP: 3
      },
      minimumDockerVersion: [8, 0]
    }
  );
});
