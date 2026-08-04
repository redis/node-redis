import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ARGETRANGE from './ARGETRANGE';
import { parseArgs } from './generic-transformers';

describe('ARGETRANGE', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(ARGETRANGE, 'key', 0, 10),
      ['ARGETRANGE', 'key', '0', '10']
    );
  });

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arGetRange forward + reverse', async client => {
    assert.equal(await client.arSet('key', 0, ['a', 'b', 'c', 'd', 'e']), 5);
    assert.deepEqual(await client.arGetRange('key', 1, 3), ['b', 'c', 'd']);
    assert.deepEqual(await client.arGetRange('key', 3, 1), ['d', 'c', 'b']);
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arGetRange errors when range exceeds maximum', async client => {
    assert.equal(await client.arSet('key', 0, ['a', 'b', 'c', 'd', 'e']), 5);
    await assert.rejects(() => client.arGetRange('key', 0, 1_000_000), /range exceeds maximum/i);
    await assert.rejects(() => client.arGetRange('key', 1_000_000, 0), /range exceeds maximum/i);
  }, GLOBAL.SERVERS.OPEN);
});
