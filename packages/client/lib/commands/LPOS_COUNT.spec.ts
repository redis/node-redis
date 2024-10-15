import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import LPOS_COUNT from './LPOS_COUNT';

describe('LPOS COUNT', () => {
  testUtils.isVersionGreaterThanHook([6, 0, 6]);

  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        LPOS_COUNT.transformArguments('key', 'element', 0),
        ['LPOS', 'key', 'element', 'COUNT', '0']
      );
    });

    it('with RANK', () => {
      assert.deepEqual(
        LPOS_COUNT.transformArguments('key', 'element', 0, {
          RANK: 0
        }),
        ['LPOS', 'key', 'element', 'RANK', '0', 'COUNT', '0']
      );
    });

    it('with MAXLEN', () => {
      assert.deepEqual(
        LPOS_COUNT.transformArguments('key', 'element', 0, {
          MAXLEN: 10
        }),
        ['LPOS', 'key', 'element', 'COUNT', '0', 'MAXLEN', '10']
      );
    });

    it('with RANK, MAXLEN', () => {
      assert.deepEqual(
        LPOS_COUNT.transformArguments('key', 'element', 0, {
          RANK: 0,
          MAXLEN: 10
        }),
        ['LPOS', 'key', 'element', 'RANK', '0', 'COUNT', '0', 'MAXLEN', '10']
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
