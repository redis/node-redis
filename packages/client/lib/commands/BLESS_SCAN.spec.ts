import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import BLESS_SCAN from './BLESS_SCAN';
import { parseArgs } from './generic-transformers';

describe('BLESS SCAN', () => {
  describe('transformArguments', () => {
    it('cursor and flag only', () => {
      assert.deepEqual(
        parseArgs(BLESS_SCAN, '0', 'NO-EVICT'),
        ['BLESS', 'SCAN', '0', 'NO-EVICT']
      );
    });

    it('with COUNT', () => {
      assert.deepEqual(
        parseArgs(BLESS_SCAN, '0', 'NO-EVICT', {
          COUNT: 1
        }),
        ['BLESS', 'SCAN', '0', 'NO-EVICT', 'COUNT', '1']
      );
    });
  });

  describe('behavior', () => {
    testUtils.isVersionGreaterThanHook([8, 12]);

    testUtils.testWithClient('client.blessScan', async client => {
      assert.deepEqual(
        await client.blessScan('0', 'NO-EVICT'),
        {
          cursor: '0',
          keys: []
        }
      );
    }, GLOBAL.SERVERS.OPEN);
  });
});
