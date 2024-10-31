import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ZDIFF_WITHSCORES from './ZDIFF_WITHSCORES';
import { parseArgs } from './generic-transformers';

describe('ZDIFF WITHSCORES', () => {
  testUtils.isVersionGreaterThanHook([6, 2]);

  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        parseArgs(ZDIFF_WITHSCORES, 'key'),
        ['ZDIFF', '1', 'key', 'WITHSCORES']
      );
    });

    it('array', () => {
      assert.deepEqual(
        parseArgs(ZDIFF_WITHSCORES, ['1', '2']),
        ['ZDIFF', '2', '1', '2', 'WITHSCORES']
      );
    });
  });

  testUtils.testAll('zDiffWithScores', async client => {
    assert.deepEqual(
      await client.zDiffWithScores('key'),
      []
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
