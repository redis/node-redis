import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import RESERVE from './RESERVE';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('CF.RESERVE', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(RESERVE, 'key', 4),
        ['CF.RESERVE', 'key', '4']
      );
    });

    it('with EXPANSION', () => {
      assert.deepEqual(
        parseArgs(RESERVE, 'key', 4, {
          EXPANSION: 1
        }),
        ['CF.RESERVE', 'key', '4', 'EXPANSION', '1']
      );
    });

    it('with BUCKETSIZE', () => {
      assert.deepEqual(
        parseArgs(RESERVE, 'key', 4, {
          BUCKETSIZE: 2
        }),
        ['CF.RESERVE', 'key', '4', 'BUCKETSIZE', '2']
      );
    });

    it('with MAXITERATIONS', () => {
      assert.deepEqual(
        parseArgs(RESERVE, 'key', 4, {
          MAXITERATIONS: 1
        }),
        ['CF.RESERVE', 'key', '4', 'MAXITERATIONS', '1']
      );
    });
  });

  testUtils.testWithClient('client.cf.reserve', async client => {
    assert.equal(
      await client.cf.reserve('key', 4),
      'OK'
    );
  }, GLOBAL.SERVERS.OPEN);
});
