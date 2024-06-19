import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import DECRBY from './DECRBY';
import { parseArgs } from './generic-transformers';

describe('DECRBY', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(DECRBY, 'key', 2),
      ['DECRBY', 'key', '2']
    );
  });

  testUtils.testAll('decrBy', async client => {
    assert.equal(
      await client.decrBy('key', 2),
      -2
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
