import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import HDEL from './HDEL';
import { parseArgs } from './generic-transformers';

describe('HDEL', () => {
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        parseArgs(HDEL, 'key', 'field'),
        ['HDEL', 'key', 'field']
      );
    });

    it('array', () => {
      assert.deepEqual(
        parseArgs(HDEL, 'key', ['1', '2']),
        ['HDEL', 'key', '1', '2']
      );
    });
  });

  testUtils.testAll('hDel', async client => {
    assert.equal(
      await client.hDel('key', 'field'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
