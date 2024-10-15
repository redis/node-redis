import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ZMSCORE from './ZMSCORE';

describe('ZMSCORE', () => {
  testUtils.isVersionGreaterThanHook([6, 2]);

  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        ZMSCORE.transformArguments('key', 'member'),
        ['ZMSCORE', 'key', 'member']
      );
    });

    it('array', () => {
      assert.deepEqual(
        ZMSCORE.transformArguments('key', ['1', '2']),
        ['ZMSCORE', 'key', '1', '2']
      );
    });
  });

  testUtils.testAll('zmScore', async client => {
    assert.deepEqual(
      await client.zmScore('key', 'member'),
      [null]
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
