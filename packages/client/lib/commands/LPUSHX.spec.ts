import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import LPUSHX from './LPUSHX';
import { parseArgs } from './generic-transformers';

describe('LPUSHX', () => {
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        parseArgs(LPUSHX, 'key', 'element'),
        ['LPUSHX', 'key', 'element']
      );
    });

    it('array', () => {
      assert.deepEqual(
        parseArgs(LPUSHX, 'key', ['1', '2']),
        ['LPUSHX', 'key', '1', '2']
      );
    });
  });

  testUtils.testAll('lPushX', async client => {
    assert.equal(
      await client.lPushX('key', 'element'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
