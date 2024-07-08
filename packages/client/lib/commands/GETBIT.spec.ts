import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import GETBIT from './GETBIT';
import { parseArgs } from './generic-transformers';

describe('GETBIT', () => {
  it('processCommand', () => {
    assert.deepEqual(
      parseArgs(GETBIT, 'key', 0),
      ['GETBIT', 'key', '0']
    );
  });

  testUtils.testAll('getBit', async client => {
    assert.equal(
      await client.getBit('key', 0),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
