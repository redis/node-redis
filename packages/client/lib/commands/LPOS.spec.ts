import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import LPOS, { LPosOptions } from './LPOS';
import { parseArgs } from './generic-transformers';

describe('LPOS', () => {
  testUtils.isVersionGreaterThanHook([6, 0, 6]);

  describe('processCommand', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(LPOS, 'key', 'element'),
        ['LPOS', 'key', 'element']
      );
    });

    it('with RANK', () => {
      assert.deepEqual(
        parseArgs(LPOS, 'key', 'element', {
          RANK: 0
        }),
        ['LPOS', 'key', 'element', 'RANK', '0']
      );
    });

    it('with MAXLEN', () => {
      assert.deepEqual(
        parseArgs(LPOS, 'key', 'element', {
          MAXLEN: 10
        }),
        ['LPOS', 'key', 'element', 'MAXLEN', '10']
      );
    });
    it('with COUNT', () => {
    assert.deepEqual(
      parseArgs(LPOS, 'key', 'element', {
        COUNT: 2
      }),
      ['LPOS', 'key', 'element', 'COUNT', '2']
    );
  });

    it('with RANK, COUNT, MAXLEN', () => {
      assert.deepEqual(
        parseArgs(LPOS, 'key', 'element', {
          RANK: 0,
          COUNT: 2,
          MAXLEN: 10
        }),
        ['LPOS', 'key', 'element', 'RANK', '0', 'COUNT', '2', 'MAXLEN', '10']
      );
    });
  });

  testUtils.testAll('lPos', async client => {
    assert.equal(
      await client.lPos('key', 'element'),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
