import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import HINCRBY from './HINCRBY';
import { parseArgs } from './generic-transformers';

describe('HINCRBY', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(HINCRBY, 'key', 'field', 1),
      ['HINCRBY', 'key', 'field', '1']
    );
  });

  testUtils.testAll('hIncrBy', async client => {
    assert.equal(
      await client.hIncrBy('key', 'field', 1),
      1
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
