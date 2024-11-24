import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ZINCRBY from './ZINCRBY';
import { parseArgs } from './generic-transformers';

describe('ZINCRBY', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(ZINCRBY, 'key', 1, 'member'),
      ['ZINCRBY', 'key', '1', 'member']
    );
  });

  testUtils.testAll('zIncrBy', async client => {
    assert.equal(
      await client.zIncrBy('destination', 1, 'member'),
      1
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
