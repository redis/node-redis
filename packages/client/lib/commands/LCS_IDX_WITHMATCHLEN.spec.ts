import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import LCS_IDX_WITHMATCHLEN from './LCS_IDX_WITHMATCHLEN';
import { parseArgs } from './generic-transformers';

describe('LCS IDX WITHMATCHLEN', () => {
  testUtils.isVersionGreaterThanHook([7]);

  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(LCS_IDX_WITHMATCHLEN, '1', '2'),
        ['LCS', '1', '2', 'IDX', 'WITHMATCHLEN']
      );
    });

    it('with MINMATCHLEN', () => {
      assert.deepEqual(
        parseArgs(LCS_IDX_WITHMATCHLEN, '1', '2', {
          MINMATCHLEN: 10
        }),
        ['LCS', '1', '2', 'IDX', 'MINMATCHLEN', '10', 'WITHMATCHLEN']
      );
    });

    it('with MINMATCHLEN 0', () => {
      assert.deepEqual(
        parseArgs(LCS_IDX_WITHMATCHLEN, '1', '2', {
          MINMATCHLEN: 0
        }),
        ['LCS', '1', '2', 'IDX', 'MINMATCHLEN', '0', 'WITHMATCHLEN']
      );
    });

    it('omits an undefined MINMATCHLEN', () => {
      assert.deepEqual(
        parseArgs(LCS_IDX_WITHMATCHLEN, '1', '2', {
          MINMATCHLEN: undefined
        }),
        ['LCS', '1', '2', 'IDX', 'WITHMATCHLEN']
      );
    });
  });

  testUtils.testWithClient('client.lcsIdxWithMatchLen', async client => {
    const [, reply] = await Promise.all([
      client.mSet({
        '1': 'abc',
        '2': 'bc'
      }),
      client.lcsIdxWithMatchLen('1', '2')
    ]);

    assert.deepEqual(
      reply,
      {
        matches: [
          [[1, 2], [0, 1], 2]
        ],
        len: 2
      }
    );
  }, GLOBAL.SERVERS.OPEN);
});
