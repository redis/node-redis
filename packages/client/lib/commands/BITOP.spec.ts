import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import BITOP from './BITOP';

describe('BITOP', () => {
  describe('transformArguments', () => {
    it('single key', () => {
      assert.deepEqual(
        BITOP.transformArguments('AND', 'destKey', 'key'),
        ['BITOP', 'AND', 'destKey', 'key']
      );
    });

    it('multiple keys', () => {
      assert.deepEqual(
        BITOP.transformArguments('AND', 'destKey', ['1', '2']),
        ['BITOP', 'AND', 'destKey', '1', '2']
      );
    });
  });

  testUtils.testAll('bitOp', async client => {
    assert.equal(
      await client.bitOp('AND', '{tag}destKey', '{tag}key'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
