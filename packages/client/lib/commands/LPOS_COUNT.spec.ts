import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import LPOS_COUNT from './LPOS_COUNT';
import { parseArgs } from './generic-transformers';

describe('LPOS COUNT', () => {
  testUtils.isVersionGreaterThanHook([6, 0, 6]);

  describe('processCommand', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(LPOS_COUNT, 'key', 'element', 0),
        ['LPOS', 'key', 'element', 'COUNT', '0']
      );
    });

    it('with RANK', () => {
      assert.deepEqual(
        parseArgs(LPOS_COUNT, 'key', 'element', 0, {
          RANK: 0
        }),
        ['LPOS', 'key', 'element', 'RANK', '0', 'COUNT', '0']
      );
    });

    it('with MAXLEN', () => {
      assert.deepEqual(
        parseArgs(LPOS_COUNT, 'key', 'element', 0, {
          MAXLEN: 10
        }),
        ['LPOS', 'key', 'element', 'MAXLEN', '10', 'COUNT', '0']
      );
    });

    it('with RANK, MAXLEN', () => {
      assert.deepEqual(
        parseArgs(LPOS_COUNT, 'key', 'element', 0, {
          RANK: 0,
          MAXLEN: 10
        }),
        ['LPOS', 'key', 'element', 'RANK', '0', 'MAXLEN', '10', 'COUNT', '0']
      );
    });
  });

  testUtils.testAll('lPosCount', async client => {
    assert.deepEqual(
      await client.lPosCount('key', 'element', 0),
      []
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
