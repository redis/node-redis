import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import BLESS_CLEAR from './BLESS_CLEAR';
import { parseArgs } from './generic-transformers';

describe('BLESS CLEAR', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(BLESS_CLEAR, 'key', 'NO-EVICT'),
        ['BLESS', 'CLEAR', 'key', 'NO-EVICT']
      );
    });
  });

  describe('behavior', () => {
    testUtils.isVersionGreaterThanHook([8, 12]);

    testUtils.testAll('client.blessClear', async client => {
      await client.set('key', 'value');
      await client.blessSet('key', 'NO-EVICT');

      assert.equal(await client.blessClear('key', 'NO-EVICT'), 1);
      assert.equal(await client.blessClear('key', 'NO-EVICT'), 0);
    }, {
      client: GLOBAL.SERVERS.OPEN,
      cluster: GLOBAL.CLUSTERS.OPEN
    });
  });
});
