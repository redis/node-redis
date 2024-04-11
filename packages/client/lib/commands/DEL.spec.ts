import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import DEL from './DEL';

describe('DEL', () => {
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        DEL.transformArguments('key'),
        ['DEL', 'key']
      );
    });

    it('array', () => {
      assert.deepEqual(
        DEL.transformArguments(['key1', 'key2']),
        ['DEL', 'key1', 'key2']
      );
    });
  });

  testUtils.testAll('del', async client => {
    assert.equal(
      await client.del('key'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
