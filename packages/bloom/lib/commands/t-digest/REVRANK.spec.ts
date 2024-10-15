import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import REVRANK from './REVRANK';

describe('TDIGEST.REVRANK', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      REVRANK.transformArguments('key', [1, 2]),
      ['TDIGEST.REVRANK', 'key', '1', '2']
    );
  });

  testUtils.testWithClient('client.tDigest.revRank', async client => {
    const [, reply] = await Promise.all([
      client.tDigest.create('key'),
      client.tDigest.revRank('key', [1])
    ]);

    assert.deepEqual(reply, [-2]);
  }, GLOBAL.SERVERS.OPEN);
});
