import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ZREVRANK from './ZREVRANK';

describe('ZREVRANK', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      ZREVRANK.transformArguments('key', 'member'),
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
