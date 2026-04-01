import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SDIFF from './SDIFF';
import { parseArgs } from './generic-transformers';

describe('SDIFF', () => {
  describe('processCommand', () => {
    it('string', () => {
      assert.deepEqual(
        parseArgs(SDIFF, 'key'),
        ['SDIFF', 'key']
      );
    });

    it('array', () => {
      assert.deepEqual(
        parseArgs(SDIFF, ['1', '2']),
        ['SDIFF', '1', '2']
      );
    });
  });

  testUtils.testAll('sDiff', async client => {
    assert.deepEqual(
      await client.sDiff('key'),
      []
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  testUtils.testWithClient('sDiff with data', async client => {
    await client.sAdd('sdiff-r3-1', ['a', 'b', 'c', 'd']);
    await client.sAdd('sdiff-r3-2', ['c']);
    await client.sAdd('sdiff-r3-3', ['a', 'c', 'e']);

    const result = await client.sDiff(['sdiff-r3-1', 'sdiff-r3-2', 'sdiff-r3-3']);

    // RESP3 returns a Set reply; verify it contains the expected members
    assert.ok(Array.isArray(result));
    const sorted = [...result].sort();
    assert.deepEqual(sorted, ['b', 'd']);
  }, GLOBAL.SERVERS.OPEN);
});
