import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SINTERCARD from './SINTERCARD';
import { parseArgs } from './generic-transformers';

describe('SINTERCARD', () => {
  testUtils.isVersionGreaterThanHook([7]);

  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(SINTERCARD, ['1', '2']),
        ['SINTERCARD', '2', '1', '2']
      );
    });

    it('with limit (backwards compatibility)', () => {
      assert.deepEqual(
        parseArgs(SINTERCARD, ['1', '2'], 1),
        ['SINTERCARD', '2', '1', '2', 'LIMIT', '1']
      );
    });

    it('with LIMIT', () => {
      assert.deepEqual(
        parseArgs(SINTERCARD, ['1', '2'], {
          LIMIT: 1
        }),
        ['SINTERCARD', '2', '1', '2', 'LIMIT', '1']
      );
    });
  });

  testUtils.testAll('sInterCard', async client => {
    assert.deepEqual(
      await client.sInterCard('key'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
