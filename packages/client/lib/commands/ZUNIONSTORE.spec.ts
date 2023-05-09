import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import ZUNIONSTORE from './ZUNIONSTORE';

describe('ZUNIONSTORE', () => {
  describe('transformArguments', () => {
    it('key (string)', () => {
      assert.deepEqual(
        ZUNIONSTORE.transformArguments('destination', 'key'),
        ['ZUNIONSTORE', 'destination', '1', 'key']
      );
    });

    it('keys (array)', () => {
      assert.deepEqual(
        ZUNIONSTORE.transformArguments('destination', ['1', '2']),
        ['ZUNIONSTORE', 'destination', '2', '1', '2']
      );
    });

    it('with WEIGHTS', () => {
      assert.deepEqual(
        ZUNIONSTORE.transformArguments('destination', 'key', {
          WEIGHTS: [1]
        }),
        ['ZUNIONSTORE', 'destination', '1', 'key', 'WEIGHTS', '1']
      );
    });

    it('with AGGREGATE', () => {
      assert.deepEqual(
        ZUNIONSTORE.transformArguments('destination', 'key', {
          AGGREGATE: 'SUM'
        }),
        ['ZUNIONSTORE', 'destination', '1', 'key', 'AGGREGATE', 'SUM']
      );
    });

    it('with WEIGHTS, AGGREGATE', () => {
      assert.deepEqual(
        ZUNIONSTORE.transformArguments('destination', 'key', {
          WEIGHTS: [1],
          AGGREGATE: 'SUM'
        }),
        ['ZUNIONSTORE', 'destination', '1', 'key', 'WEIGHTS', '1', 'AGGREGATE', 'SUM']
      );
    });
  });

  testUtils.testAll('zUnionStore', async client => {
    assert.equal(
      await client.zUnionStore('{tag}destination', '{tag}key'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
