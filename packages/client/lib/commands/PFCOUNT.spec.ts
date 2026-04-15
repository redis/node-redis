import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import PFCOUNT from './PFCOUNT';
import { parseArgs } from './generic-transformers';

describe('PFCOUNT', () => {
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        parseArgs(PFCOUNT, 'key'),
        ['PFCOUNT', 'key']
      );
    });

    it('array', () => {
      assert.deepEqual(
        parseArgs(PFCOUNT, ['1', '2']),
        ['PFCOUNT', '1', '2']
      );
    });
  });

  testUtils.testAll('pfCount', async client => {
    assert.equal(
      await client.pfCount('key'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  testUtils.testAll('pfCount with data', async client => {
    await client.pfAdd('key', ['a', 'b', 'c']);
    const count = await client.pfCount('key');
    // Structural assertion: must be a primitive number, not an object/array/map
    assert.equal(typeof count, 'number');
    assert.ok(Number.isInteger(count));
    assert.ok(count >= 3); // HyperLogLog approximation, should be at least 3
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
