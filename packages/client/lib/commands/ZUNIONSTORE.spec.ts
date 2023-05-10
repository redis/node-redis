import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import ZUNIONSTORE from './ZUNIONSTORE';

describe('ZUNIONSTORE', () => {
  describe('transformArguments', () => {
    it('key (string)', () => {
      assert.deepEqual(
        ZUNIONSTORE.transformArguments('destination', 'source'),
        ['ZUNIONSTORE', 'destination', '1', 'key']
      );
    });

    it('keys (Array<string>)', () => {
      assert.deepEqual(
        ZUNIONSTORE.transformArguments('destination', ['1', '2']),
        ['ZUNIONSTORE', 'destination', '2', '1', '2']
      );
    });

    it('key & weight', () => {
      assert.deepEqual(
        ZUNIONSTORE.transformArguments('destination', {
          key: 'key',
          weight: 1
        }),
        ['ZUNIONSTORE', 'destination', '1', 'key', 'WEIGHTS', '1']
      );
    });

    it('keys & weights', () => {
      assert.deepEqual(
        ZUNIONSTORE.transformArguments('destination', [{
          key: 'a',
          weight: 1
        }, {
          key: 'b',
          weight: 2
        }]),
        ['ZUNIONSTORE', 'destination', '2', 'a', 'b', 'WEIGHTS', '1', '2']
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
