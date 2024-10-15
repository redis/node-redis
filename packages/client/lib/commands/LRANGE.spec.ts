import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import LRANGE from './LRANGE';
import { parseArgs } from './generic-transformers';

describe('LRANGE', () => {
  it('processCommand', () => {
    assert.deepEqual(
      parseArgs(LRANGE, 'key', 0, -1),
      ['LRANGE', 'key', '0', '-1']
    );
  });

  testUtils.testAll('lRange', async client => {
    assert.deepEqual(
      await client.lRange('key', 0, -1),
      []
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
