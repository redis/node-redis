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

  testUtils.testWithClient('client.tDigest.trimmedMean with data', async client => {
    await client.tDigest.create('key');
    await client.tDigest.add('key', [1, 2, 3, 4, 5]);

    const reply = await client.tDigest.trimmedMean('key', 0.1, 0.9);

    assert.equal(typeof reply, 'number');
    assert.ok(!isNaN(reply));
    assert.ok(reply > 0 && reply < 10);
  }, GLOBAL.SERVERS.OPEN);
});
