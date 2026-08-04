import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SMEMBERS from './SMEMBERS';
import { parseArgs } from './generic-transformers';

describe('SMEMBERS', () => {
  it('processCommand', () => {
    assert.deepEqual(
      parseArgs(SMEMBERS, 'key'),
      ['SMEMBERS', 'key']
    );
  });

  testUtils.testAll('sMembers', async client => {
    assert.deepEqual(
      await client.sMembers('key'),
      []
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  testUtils.testWithClient('sMembers with data', async client => {
    await client.sAdd('smembers-r3', ['a', 'b', 'c']);

    const result = await client.sMembers('smembers-r3');

    // RESP3 returns a Set reply; verify it contains the expected members
    assert.ok(Array.isArray(result));
    const sorted = [...result].sort();
    assert.deepEqual(sorted, ['a', 'b', 'c']);
  }, GLOBAL.SERVERS.OPEN);
});
