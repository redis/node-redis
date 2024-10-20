import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import TRIMMED_MEAN from './TRIMMED_MEAN';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TDIGEST.TRIMMED_MEAN', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(TRIMMED_MEAN, 'key', 0, 1),
      ['TDIGEST.TRIMMED_MEAN', 'key', '0', '1']
    );
  });

  testUtils.testWithClient('client.tDigest.trimmedMean', async client => {
    const [, reply] = await Promise.all([
      client.tDigest.create('key'),
      client.tDigest.trimmedMean('key', 0, 1)
    ]);

    assert.equal(reply, NaN);
  }, GLOBAL.SERVERS.OPEN);
});
