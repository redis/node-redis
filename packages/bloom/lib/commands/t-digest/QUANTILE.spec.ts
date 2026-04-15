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

  testUtils.testWithClient('client.tDigest.quantile with values', async client => {
    await client.tDigest.create('key');
    await client.tDigest.add('key', [1, 2, 3, 4, 5]);

    const reply = await client.tDigest.quantile('key', [0, 0.5, 1]);

    assert.ok(Array.isArray(reply));
    assert.equal(reply.length, 3);
    assert.equal(typeof reply[0], 'number');
    assert.equal(typeof reply[1], 'number');
    assert.equal(typeof reply[2], 'number');
    // Verify approximate quantile values
    assert.ok(reply[0] >= 1 && reply[0] <= 1.5); // min
    assert.ok(reply[1] >= 2.5 && reply[1] <= 3.5); // median
    assert.ok(reply[2] >= 4.5 && reply[2] <= 5); // max
  }, GLOBAL.SERVERS.OPEN);
});
