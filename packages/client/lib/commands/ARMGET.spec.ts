import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ARMGET from './ARMGET';
import { parseArgs } from './generic-transformers';

describe('ARMGET', () => {
  describe('transformArguments', () => {
    it('single index', () => {
      assert.deepEqual(
        parseArgs(ARMGET, 'key', 0),
        ['ARMGET', 'key', '0']
      );
    });

    it('multiple indices', () => {
      assert.deepEqual(
        parseArgs(ARMGET, 'key', [0, 2, 4]),
        ['ARMGET', 'key', '0', '2', '4']
      );
    });
  });

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arMGet mixed hits + nulls', async client => {
    assert.equal(await client.arMSet('key', [[0, 'a'], [1, 'b'], [5, 'c']]), 3);
    // request 0, 1, 5, 3 → expect a, b, c, null
    assert.deepEqual(
      await client.arMGet('key', [0, 1, 5, 3]),
      ['a', 'b', 'c', null]
    );
  }, GLOBAL.SERVERS.OPEN);
});
