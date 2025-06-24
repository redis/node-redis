import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import VSIM_WITHSCORES from './VSIM_WITHSCORES';
import { BasicCommandParser } from '../client/parser';

describe('VSIM WITHSCORES', () => {
  it('parseCommand', () => {
    const parser = new BasicCommandParser();
    VSIM_WITHSCORES.parseCommand(parser, 'key', 'element')
    assert.deepEqual(parser.redisArgs, [
      'VSIM',
      'key',
      'ELE',
      'element',
      'WITHSCORES'
    ]);
  });

  testUtils.testAll(
    'vSimWithScores',
    async client => {
      await client.vAdd('key', [1.0, 2.0, 3.0], 'element1');
      await client.vAdd('key', [1.1, 2.1, 3.1], 'element2');

      const result = await client.vSimWithScores('key', 'element1');

      assert.ok(typeof result === 'object');
      assert.ok('element1' in result);
      assert.ok('element2' in result);
      assert.equal(typeof result['element1'], 'number');
      assert.equal(typeof result['element2'], 'number');
    },
    {
      client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 0] },
      cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 0] }
    }
  );

  testUtils.testWithClient(
    'vSimWithScores with RESP3 - returns Map with scores',
    async client => {
      await client.vAdd('resp3-key', [1.0, 2.0, 3.0], 'element1');
      await client.vAdd('resp3-key', [1.1, 2.1, 3.1], 'element2');
      await client.vAdd('resp3-key', [2.0, 3.0, 4.0], 'element3');

      const result = await client.vSimWithScores('resp3-key', 'element1');

      assert.ok(typeof result === 'object');
      assert.ok('element1' in result);
      assert.ok('element2' in result);
      assert.equal(typeof result['element1'], 'number');
      assert.equal(typeof result['element2'], 'number');
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
