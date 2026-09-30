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
      assert.equal(
        typeof await client.blessSet('key', 'NO-EVICT'),
        'number'
      );
    }, {
      client: GLOBAL.SERVERS.OPEN,
      cluster: GLOBAL.CLUSTERS.OPEN
    });
  });
});
