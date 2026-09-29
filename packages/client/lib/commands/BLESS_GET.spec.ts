import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import BLESS_GET from './BLESS_GET';
import { parseArgs } from './generic-transformers';

describe('BLESS GET', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(BLESS_GET, 'key'),
        ['BLESS', 'GET', 'key']
      );
    });
  });

  describe('behavior', () => {
    testUtils.isVersionGreaterThanHook([8, 12]);

    testUtils.testAll('client.blessGet', async client => {
      assert.ok(
        Array.isArray(await client.blessGet('key'))
      );
    }, {
      client: GLOBAL.SERVERS.OPEN,
      cluster: GLOBAL.CLUSTERS.OPEN
    });
  });
});
