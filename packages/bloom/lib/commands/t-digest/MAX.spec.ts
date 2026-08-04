import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import MAX from './MAX';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TDIGEST.MAX', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(MAX, 'key'),
      ['TDIGEST.MAX', 'key']
    );
  });

  testUtils.testWithClient('client.tDigest.max', async client => {
    const [, reply] = await Promise.all([
      client.tDigest.create('key'),
      client.tDigest.max('key')
    ]);

    assert.deepEqual(reply, NaN);
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('client.tDigest.max with data', async client => {
    await client.tDigest.create('key');
    await client.tDigest.add('key', [1, 2, 3, 4, 5]);
    const reply = await client.tDigest.max('key');

    assert.equal(reply, 5);
  }, GLOBAL.SERVERS.OPEN);
});
