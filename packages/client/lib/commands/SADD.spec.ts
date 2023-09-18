import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SADD from './SADD';

describe('SADD', () => {
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        SADD.transformArguments('key', 'member'),
        ['SADD', 'key', 'member']
      );
    });

    it('array', () => {
      assert.deepEqual(
        SADD.transformArguments('key', ['1', '2']),
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
