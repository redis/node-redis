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

  testUtils.testWithClient('client.tDigest.byRevRank with data', async client => {
    await client.tDigest.create('key');
    await client.tDigest.add('key', [1, 2, 3, 4, 5]);

    const reply = await client.tDigest.byRevRank('key', [0, 2, 4]);

    assert.ok(Array.isArray(reply));
    assert.equal(reply.length, 3);
    assert.equal(typeof reply[0], 'number');
    assert.equal(typeof reply[1], 'number');
    assert.equal(typeof reply[2], 'number');
    assert.ok(reply[0] >= reply[1]);
    assert.ok(reply[1] >= reply[2]);
  }, GLOBAL.SERVERS.OPEN);
});
