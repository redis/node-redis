import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import RANK from './RANK';

describe('TDIGEST.RANK', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      RANK.transformArguments('key', [1, 2]),
      ['TDIGEST.RANK', 'key', '1', '2']
    );
  });

  testUtils.testWithClient('client.tDigest.rank', async client => {
    const [, reply] = await Promise.all([
      client.tDigest.create('key'),
      client.tDigest.rank('key', [1])
    ]);

    assert.deepEqual(reply, [-2]);
  }, GLOBAL.SERVERS.OPEN);
});
