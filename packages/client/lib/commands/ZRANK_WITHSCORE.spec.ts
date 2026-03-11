import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ZRANK_WITHSCORE from './ZRANK_WITHSCORE';
import { parseArgs } from './generic-transformers';

describe('ZRANK WITHSCORE', () => {
  testUtils.isVersionGreaterThanHook([7, 2]);

  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(ZRANK_WITHSCORE, 'key', 'member'),
      ['ZRANK', 'key', 'member', 'WITHSCORE']
    );
  });

  // Regression: Number(uint8Array) is NaN when the RESP decoder hands back a
  // Uint8Array for the score BlobStringReply. A plain Uint8Array (not Buffer)
  // has a .toString() that returns comma-separated byte values instead of the
  // semantic score string, so Number() silently returns NaN.
  describe('transformReply[2] Uint8Array score', () => {
    it('Uint8Array score string is parsed as a finite number, not NaN', () => {
      const rawReply = [0, new Uint8Array(Buffer.from('1.5'))] as any;
      assert.deepEqual(
        ZRANK_WITHSCORE.transformReply[2](rawReply),
        { rank: 0, score: 1.5 }
      );
    });
  });

  testUtils.testAll('zRankWithScore - null', async client => {
    assert.equal(
      await client.zRankWithScore('key', 'member'),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  testUtils.testAll('zRankWithScore - with member', async client => {
    const member = {
      value: '1',
      score: 1
    }

    const [, reply] = await Promise.all([
      client.zAdd('key', member),
      client.zRankWithScore('key', member.value)
    ])
    assert.deepEqual(
      reply,
      {
        rank: 0,
        score: 1
      }
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
