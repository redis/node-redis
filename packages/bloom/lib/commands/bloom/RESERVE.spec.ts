import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import RESERVE from './RESERVE';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('BF.RESERVE', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(RESERVE, 'key', 0.01, 100),
        ['BF.RESERVE', 'key', '0.01', '100']
      );
    });

    it('with EXPANSION', () => {
      assert.deepEqual(
        parseArgs(RESERVE, 'key', 0.01, 100, {
          EXPANSION: 1
        }),
        ['BF.RESERVE', 'key', '0.01', '100', 'EXPANSION', '1']
      );
    });

    it('with NONSCALING', () => {
      assert.deepEqual(
        parseArgs(RESERVE, 'key', 0.01, 100, {
          NONSCALING: true
        }),
        ['BF.RESERVE', 'key', '0.01', '100', 'NONSCALING']
      );
    });

    it('with EXPANSION and NONSCALING', () => {
      assert.deepEqual(
        parseArgs(RESERVE, 'key', 0.01, 100, {
          EXPANSION: 1,
          NONSCALING: true
        }),
        ['BF.RESERVE', 'key', '0.01', '100', 'EXPANSION', '1', 'NONSCALING']
      );
    });
  });

  testUtils.testWithClient('client.bf.reserve', async client => {
    assert.equal(
      await client.bf.reserve('bloom', 0.01, 100),
      'OK'
    );
  }, GLOBAL.SERVERS.OPEN);
});
