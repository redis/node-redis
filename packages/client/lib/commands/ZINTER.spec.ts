import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ZINTER from './ZINTER';

describe('ZINTER', () => {
  testUtils.isVersionGreaterThanHook([6, 2]);

  describe('transformArguments', () => {
    it('key (string)', () => {
      assert.deepEqual(
        ZINTER.transformArguments('key'),
        ['ZINTER', '1', 'key']
      );
    });

    it('keys (Array<string>)', () => {
      assert.deepEqual(
        ZINTER.transformArguments(['1', '2']),
        ['ZINTER', '2', '1', '2']
      );
    });

    it('key & weight', () => {
      assert.deepEqual(
        ZINTER.transformArguments({
          key: 'key',
          weight: 1
        }),
        ['ZINTER', '1', 'key', 'WEIGHTS', '1']
      );
    });

    it('keys & weights', () => {
      assert.deepEqual(
        ZINTER.transformArguments([{
          key: 'a',
          weight: 1
        }, {
          key: 'b',
          weight: 2
        }]),
        ['ZINTER', '2', 'a', 'b', 'WEIGHTS', '1', '2']
      );
    });

    it('with AGGREGATE', () => {
      assert.deepEqual(
        ZINTER.transformArguments('key', {
          AGGREGATE: 'SUM'
        }),
        ['ZINTER', '1', 'key', 'AGGREGATE', 'SUM']
      );
    });
  });

  testUtils.testAll('zInter', async client => {
    assert.deepEqual(
      await client.zInter('key'),
      []
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
