import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import XLEN from './XLEN';
import { parseArgs } from './generic-transformers';

describe('XLEN', () => {
  it('processCommand', () => {
    assert.deepEqual(
      parseArgs(XLEN, 'key'),
      ['XLEN', 'key']
    );
  });

  testUtils.testAll('xLen', async client => {
    assert.equal(
      await client.xLen('key'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
