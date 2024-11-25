import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import BYREVRANK from './BYREVRANK';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TDIGEST.BYREVRANK', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(BYREVRANK, 'key', [1, 2]),
      ['TDIGEST.BYREVRANK', 'key', '1', '2']
    );
  });

  testUtils.testWithClient('client.tDigest.byRevRank', async client => {
    const [, reply] = await Promise.all([
      client.tDigest.create('key'),
      client.tDigest.byRevRank('key', [1])
    ]);

    assert.deepEqual(reply, [NaN]);
  }, GLOBAL.SERVERS.OPEN);
});
