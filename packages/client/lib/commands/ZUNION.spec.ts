import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import ZUNION from './ZUNION';

describe('ZUNION', () => {
  testUtils.isVersionGreaterThanHook([6, 2]);

  describe('transformArguments', () => {
    it('key (string)', () => {
      assert.deepEqual(
        ZUNION.transformArguments('key'),
        ['ZUNION', '1', 'key']
      );
    });

    it('keys (array)', () => {
      assert.deepEqual(
        ZUNION.transformArguments(['1', '2']),
        ['ZUNION', '2', '1', '2']
      );
    });

    it('with WEIGHTS', () => {
      assert.deepEqual(
        ZUNION.transformArguments('key', {
          WEIGHTS: [1]
        }),
        ['ZUNION', '1', 'key', 'WEIGHTS', '1']
      );
    });

    it('with AGGREGATE', () => {
      assert.deepEqual(
        ZUNION.transformArguments('key', {
          AGGREGATE: 'SUM'
        }),
        ['ZUNION', '1', 'key', 'AGGREGATE', 'SUM']
      );
    });
  });

  testUtils.testAll('zUnion', async client => {
    assert.deepEqual(
      await client.zUnion('key'),
      []
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
