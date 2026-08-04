import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import { parseArgs } from './generic-transformers';
import ZREVRANK_WITHSCORE from './ZREVRANK_WITHSCORE';

describe('ZREVRANK WITHSCORE', () => {
  testUtils.isVersionGreaterThanHook([7, 2]);

  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(ZREVRANK_WITHSCORE, 'key', 'member'),
      ['ZREVRANK', 'key', 'member', 'WITHSCORE']
    );
  });

  testUtils.testAll('zRevRankWithScore - null', async client => {
    assert.equal(
      await client.zRevRankWithScore('key', 'member'),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  testUtils.testAll('zRevRankWithScore - with member', async client => {
    const members = [{
      value: '1',
      score: 1
    }, {
      value: '2',
      score: 2
    }];

    const [, reply] = await Promise.all([
      client.zAdd('key', members),
      client.zRevRankWithScore('key', members[0].value)
    ]);
    assert.deepEqual(
      reply,
      {
        rank: 1,
        score: 1
      }
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
