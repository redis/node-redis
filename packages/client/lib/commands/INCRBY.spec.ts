import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import INCRBY from './INCRBY';
import { parseArgs } from './generic-transformers';

describe('INCRBY', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(INCRBY, 'key', 1),
      ['INCRBY', 'key', '1']
    );
  });

  testUtils.testAll('incrBy', async client => {
    assert.equal(
      await client.incrBy('key', 1),
      1
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
