import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import LPUSHX from './LPUSHX';

describe('LPUSHX', () => {
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        LPUSHX.transformArguments('key', 'element'),
        ['LPUSHX', 'key', 'element']
      );
    });

    it('array', () => {
      assert.deepEqual(
        LPUSHX.transformArguments('key', ['1', '2']),
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
