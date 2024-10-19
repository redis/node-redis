import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import REVRANK from './REVRANK';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TDIGEST.REVRANK', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(REVRANK, 'key', [1, 2]),
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
