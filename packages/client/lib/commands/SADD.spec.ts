import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SADD from './SADD';
import { parseArgs } from './generic-transformers';

describe('SADD', () => {
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        parseArgs(SADD, 'key', 'member'),
        ['SADD', 'key', 'member']
      );
    });

    it('array', () => {
      assert.deepEqual(
        parseArgs(SADD, 'key', ['1', '2']),
        ['SADD', 'key', '1', '2']
      );
    });
  });

  testUtils.testAll('sAdd', async client => {
    assert.equal(
      await client.sAdd('key', 'member'),
      1
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
