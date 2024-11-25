import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SISMEMBER from './SISMEMBER';
import { parseArgs } from './generic-transformers';

describe('SISMEMBER', () => {
  it('processCommand', () => {
    assert.deepEqual(
      parseArgs(SISMEMBER, 'key', 'member'),
      ['SISMEMBER', 'key', 'member']
    );
  });

  testUtils.testAll('sIsMember', async client => {
    assert.equal(
      await client.sIsMember('key', 'member'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
