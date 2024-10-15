import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ZINTERSTORE from './ZINTERSTORE';

describe('ZINTERSTORE', () => {
  describe('transformArguments', () => {
    it('key (string)', () => {
      assert.deepEqual(
        ZINTERSTORE.transformArguments('destination', 'source'),
        ['ZINTERSTORE', 'destination', '1', 'source']
      );
    });

    it('keys (Array<string>)', () => {
      assert.deepEqual(
        ZINTERSTORE.transformArguments('destination', ['1', '2']),
        ['ZINTERSTORE', 'destination', '2', '1', '2']
      );
    });

    it('key & weight', () => {
      assert.deepEqual(
        ZINTERSTORE.transformArguments('destination', {
          key: 'source',
          weight: 1
        }),
        ['ZINTERSTORE', 'destination', '1', 'source', 'WEIGHTS', '1']
      );
    });

    it('keys & weights', () => {
      assert.deepEqual(
        ZINTERSTORE.transformArguments('destination', [{
          key: 'a',
          weight: 1
        }, {
          key: 'b',
          weight: 2
        }]),
        ['ZINTERSTORE', 'destination', '2', 'a', 'b', 'WEIGHTS', '1', '2']
      );
    });

    it('with AGGREGATE', () => {
      assert.deepEqual(
        ZINTERSTORE.transformArguments('destination', 'source', {
          AGGREGATE: 'SUM'
        }),
        ['ZINTERSTORE', 'destination', '1', 'source', 'AGGREGATE', 'SUM']
      );
    });
  });

  testUtils.testAll('zInterStore', async client => {
    assert.equal(
      await client.zInterStore('{tag}destination', '{tag}key'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
