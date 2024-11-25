import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import ADD from './ADD';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TDIGEST.ADD', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(ADD, 'key', [1, 2]),
      ['TDIGEST.ADD', 'key', '1', '2']
    );
  });

  testUtils.testWithClient('client.tDigest.add', async client => {
    const [, reply] = await Promise.all([
      client.tDigest.create('key'),
      client.tDigest.add('key', [1])
    ]);

    assert.equal(reply, 'OK');
  }, GLOBAL.SERVERS.OPEN);
});
