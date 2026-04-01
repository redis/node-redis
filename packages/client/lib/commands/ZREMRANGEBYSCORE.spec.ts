import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import { parseArgs } from './generic-transformers';
import ZREMRANGEBYSCORE from './ZREMRANGEBYSCORE';

describe('ZREMRANGEBYSCORE', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(ZREMRANGEBYSCORE, 'key', 0, 1),
      ['ZREMRANGEBYSCORE', 'key', '0', '1']
    );
  });

  testUtils.testAll('zRemRangeByScore', async client => {
    assert.equal(
      await client.zRemRangeByScore('key', 0, 1),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  testUtils.testAll('zRemRangeByScore with members', async client => {
    await client.zAdd('key', [
      { score: 1, value: 'one' },
      { score: 2, value: 'two' },
      { score: 3, value: 'three' }
    ]);

    const reply = await client.zRemRangeByScore('key', 1, 2);
    assert.equal(typeof reply, 'number');
    assert.equal(reply, 2);
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
