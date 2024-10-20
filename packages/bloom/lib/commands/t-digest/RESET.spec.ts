import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import RESET from './RESET';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TDIGEST.RESET', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(RESET, 'key'),
      ['TDIGEST.RESET', 'key']
    );
  });

  testUtils.testWithClient('client.tDigest.reset', async client => {
    const [, reply] = await Promise.all([
      client.tDigest.create('key'),
      client.tDigest.reset('key')
    ]);

    assert.equal(reply, 'OK');
  }, GLOBAL.SERVERS.OPEN);
});
