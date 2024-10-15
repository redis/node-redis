import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ZREM from './ZREM';
import { parseArgs } from './generic-transformers';

describe('ZREM', () => {
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        parseArgs(ZREM, 'key', 'member'),
        ['ZREM', 'key', 'member']
      );
    });

    it('array', () => {
      assert.deepEqual(
        parseArgs(ZREM, 'key', ['1', '2']),
        ['ZREM', 'key', '1', '2']
      );
    });
  });

  testUtils.testAll('zRem', async client => {
    assert.equal(
      await client.zRem('key', 'member'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
