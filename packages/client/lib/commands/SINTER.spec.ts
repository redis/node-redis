import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SINTER from './SINTER';
import { parseArgs } from './generic-transformers';

describe('SINTER', () => {
  describe('processCommand', () => {
    it('string', () => {
      assert.deepEqual(
        parseArgs(SINTER, 'key'),
        ['SINTER', 'key']
      );
    });

    it('array', () => {
      assert.deepEqual(
        parseArgs(SINTER, ['1', '2']),
        ['SINTER', '1', '2']
      );
    });
  });

  testUtils.testAll('sInter', async client => {
    assert.deepEqual(
      await client.sInter('key'),
      []
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  testUtils.testWithClient('sInter with RESP3 - returns Set reply', async client => {
    await client.sAdd('sinter-r3-1', ['a', 'b', 'c']);
    await client.sAdd('sinter-r3-2', ['b', 'c', 'd']);

    const result = await client.sInter(['sinter-r3-1', 'sinter-r3-2']);

    // RESP3 returns a Set reply; verify it contains the expected members
    assert.ok(Array.isArray(result));
    const sorted = [...result].sort();
    assert.deepEqual(sorted, ['b', 'c']);
  }, GLOBAL.SERVERS.OPEN);
});
