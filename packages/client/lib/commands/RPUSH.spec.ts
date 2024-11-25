import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import RPUSH from './RPUSH';
import { parseArgs } from './generic-transformers';

describe('RPUSH', () => {
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        parseArgs(RPUSH, 'key', 'element'),
        ['RPUSH', 'key', 'element']
      );
    });

    it('array', () => {
      assert.deepEqual(
        parseArgs(RPUSH, 'key', ['1', '2']),
        ['RPUSH', 'key', '1', '2']
      );
    });
  });

  testUtils.testAll('rPush', async client => {
    assert.equal(
      await client.rPush('key', 'element'),
      1
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
