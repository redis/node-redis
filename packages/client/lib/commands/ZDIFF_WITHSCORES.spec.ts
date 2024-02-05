import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ZDIFF_WITHSCORES from './ZDIFF_WITHSCORES';

describe('ZDIFF WITHSCORES', () => {
  testUtils.isVersionGreaterThanHook([6, 2]);

  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        ZDIFF_WITHSCORES.transformArguments('key'),
        ['ZDIFF', '1', 'key', 'WITHSCORES']
      );
    });

    it('array', () => {
      assert.deepEqual(
        ZDIFF_WITHSCORES.transformArguments(['1', '2']),
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
