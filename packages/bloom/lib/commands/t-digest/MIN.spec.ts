import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import MIN from './MIN';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TDIGEST.MIN', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(MIN, 'key'),
      ['TDIGEST.MIN', 'key']
    );
  });

  testUtils.testWithClient('client.tDigest.min', async client => {
    const [, reply] = await Promise.all([
      client.tDigest.create('key'),
      client.tDigest.min('key')
    ]);

    assert.equal(reply, NaN);
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('client.tDigest.min with data', async client => {
    await client.tDigest.create('key');
    await client.tDigest.add('key', [1, 2, 3, 4, 5]);

    const reply = await client.tDigest.min('key');

    assert.equal(typeof reply, 'number');
    assert.equal(reply, 1);
  }, GLOBAL.SERVERS.OPEN);
});
