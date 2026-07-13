import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SDIFFCARD from './SDIFFCARD';
import { parseArgs } from './generic-transformers';

describe('SDIFFCARD', () => {
  testUtils.isVersionGreaterThanHook([8, 10]);

  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(SDIFFCARD, ['1', '2']),
        ['SDIFFCARD', '2', '1', '2']
      );
    });

    it('with LIMIT', () => {
      assert.deepEqual(
        parseArgs(SDIFFCARD, ['1', '2'], {
          LIMIT: 3
        }),
        ['SDIFFCARD', '2', '1', '2', 'LIMIT', '3']
      );
    });
  });

  testUtils.testAll('sDiffCard', async client => {
    assert.equal(
      await client.sDiffCard('key'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
