import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import VSIM_WITHSCORES from './VSIM_WITHSCORES';
import { parseArgs } from './generic-transformers';

describe('VSIM WITHSCORES', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(VSIM_WITHSCORES, 'key', 'element'),
      ['VSIM', 'key', 'ELE', 'element', 'WITHSCORES']
    );
  });

  testUtils.testAll('vSimWithScores', async client => {
    await client.vAdd('key', [1.0, 2.0, 3.0], 'element1');
    await client.vAdd('key', [1.1, 2.1, 3.1], 'element2');

    const result = await client.vSimWithScores('key', 'element1');
    assert.ok(Array.isArray(result));
    assert.ok(result.length > 0);
    assert.ok(typeof result[0] === 'object');
    assert.ok('value' in result[0] && 'score' in result[0]);
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
