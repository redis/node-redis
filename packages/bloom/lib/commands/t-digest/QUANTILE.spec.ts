import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import QUANTILE from './QUANTILE';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TDIGEST.QUANTILE', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(QUANTILE, 'key', [1, 2]),
      ['TDIGEST.QUANTILE', 'key', '1', '2']
    );
  });

  testUtils.testWithClient('client.tDigest.quantile', async client => {
    const [, reply] = await Promise.all([
      client.tDigest.create('key'),
      client.tDigest.quantile('key', [1])
    ]);

    assert.deepEqual(
      reply,
      [NaN]
    );
  }, GLOBAL.SERVERS.OPEN);
});
