import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import RPUSHX from './RPUSHX';
import { parseArgs } from './generic-transformers';

describe('RPUSHX', () => {
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        parseArgs(RPUSHX, 'key', 'element'),
        ['RPUSHX', 'key', 'element']
      );
    });

    it('array', () => {
      assert.deepEqual(
        parseArgs(RPUSHX, 'key', ['1', '2']),
        ['RPUSHX', 'key', '1', '2']
      );
    });
  });

  testUtils.testAll('rPushX', async client => {
    assert.equal(
      await client.rPushX('key', 'element'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
