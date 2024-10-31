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
});
