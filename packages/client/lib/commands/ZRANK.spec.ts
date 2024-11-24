import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ZRANK from './ZRANK';
import { parseArgs } from './generic-transformers';

describe('ZRANK', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(ZRANK, 'key', 'member'),
      ['ZRANK', 'key', 'member']
    );
  });

  testUtils.testAll('zRank', async client => {
    assert.equal(
      await client.zRank('key', 'member'),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
