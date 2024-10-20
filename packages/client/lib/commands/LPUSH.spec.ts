import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import LPUSH from './LPUSH';
import { parseArgs } from './generic-transformers';

describe('LPUSH', () => {
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        parseArgs(LPUSH, 'key', 'field'),
        ['LPUSH', 'key', 'field']
      );
    });

    it('array', () => {
      assert.deepEqual(
        parseArgs(LPUSH, 'key', ['1', '2']),
        ['LPUSH', 'key', '1', '2']
      );
    });
  });

  testUtils.testAll('lPush', async client => {
    assert.equal(
      await client.lPush('key', 'field'),
      1
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
