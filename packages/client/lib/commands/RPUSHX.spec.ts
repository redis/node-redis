import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import RPUSHX from './RPUSHX';

describe('RPUSHX', () => {
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        RPUSHX.transformArguments('key', 'element'),
        ['RPUSHX', 'key', 'element']
      );
    });

    it('array', () => {
      assert.deepEqual(
        RPUSHX.transformArguments('key', ['1', '2']),
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
