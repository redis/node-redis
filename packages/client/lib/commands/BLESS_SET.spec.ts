import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import BLESS_SET from './BLESS_SET';
import { parseArgs } from './generic-transformers';

describe('BLESS SET', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(BLESS_SET, 'key', 'NO-EVICT'),
        ['BLESS', 'SET', 'key', 'NO-EVICT']
      );
    });
  });

  describe('behavior', () => {
    testUtils.isVersionGreaterThanHook([8, 12]);

    testUtils.testAll('client.blessSet', async client => {
      await client.set('key', 'value');

      assert.equal(await client.blessSet('key', 'NO-EVICT'), 1);
      assert.equal(await client.blessSet('key', 'NO-EVICT'), 0);
    }, {
      client: GLOBAL.SERVERS.OPEN,
      cluster: GLOBAL.CLUSTERS.OPEN
    });
  });
});
