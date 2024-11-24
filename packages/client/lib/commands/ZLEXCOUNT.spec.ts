import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ZLEXCOUNT from './ZLEXCOUNT';
import { parseArgs } from './generic-transformers';

describe('ZLEXCOUNT', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(ZLEXCOUNT, 'key', '[a', '[b'),
      ['ZLEXCOUNT', 'key', '[a', '[b']
    );
  });

  testUtils.testAll('zLexCount', async client => {
    assert.equal(
      await client.zLexCount('key', '[a', '[b'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
