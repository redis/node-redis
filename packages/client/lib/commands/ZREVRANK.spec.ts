import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import { parseArgs } from './generic-transformers';
import ZREVRANK from './ZREVRANK';

describe('ZREVRANK', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(ZREVRANK, 'key', 'member'),
      ['ZREVRANK', 'key', 'member']
    );
  });

  testUtils.testAll('zRevRank', async client => {
    assert.equal(
      await client.zRevRank('key', 'member'),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
