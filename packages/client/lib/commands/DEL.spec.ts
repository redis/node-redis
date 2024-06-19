import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import DEL from './DEL';
import { parseArgs } from './generic-transformers';

describe('DEL', () => {
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        parseArgs(DEL, 'key'),
        ['DEL', 'key']
      );
    });

    it('array', () => {
      assert.deepEqual(
        parseArgs(DEL, ['key1', 'key2']),
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
