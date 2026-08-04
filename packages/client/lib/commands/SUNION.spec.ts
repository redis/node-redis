import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SUNION from './SUNION';
import { parseArgs } from './generic-transformers';

describe('SUNION', () => {
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        parseArgs(SUNION, 'key'),
        ['SUNION', 'key']
      );
    });

    it('array', () => {
      assert.deepEqual(
        parseArgs(SUNION, ['1', '2']),
        ['SUNION', '1', '2']
      );
    });
  });

  testUtils.testAll('sUnion', async client => {
    assert.deepEqual(
      await client.sUnion('key'),
      []
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  testUtils.testWithClient('sUnion with data', async client => {
    await client.sAdd('sunion-r3-1', ['a', 'b', 'c', 'd']);
    await client.sAdd('sunion-r3-2', ['c', 'e']);

    const result = await client.sUnion(['sunion-r3-1', 'sunion-r3-2']);

    // RESP3 returns a Set reply; verify it contains the expected members
    assert.ok(Array.isArray(result));
    const sorted = [...result].sort();
    assert.deepEqual(sorted, ['a', 'b', 'c', 'd', 'e']);
  }, GLOBAL.SERVERS.OPEN);
});
