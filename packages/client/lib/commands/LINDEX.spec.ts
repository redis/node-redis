import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import LINDEX from './LINDEX';
import { parseArgs } from './generic-transformers';

describe('LINDEX', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(LINDEX, 'key', 0),
      ['LINDEX', 'key', '0']
    );
  });

  testUtils.testAll('lIndex', async client => {
    assert.equal(
      await client.lIndex('key', 0),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});