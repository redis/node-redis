import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import BITOP from './BITOP';
import { parseArgs } from './generic-transformers';

describe('BITOP', () => {
  describe('transformArguments', () => {
    it('single key', () => {
      assert.deepEqual(
        parseArgs(BITOP, 'AND', 'destKey', 'key'),
        ['BITOP', 'AND', 'destKey', 'key']
      );
    });

    it('multiple keys', () => {
      assert.deepEqual(
        parseArgs(BITOP, 'AND', 'destKey', ['1', '2']),
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
