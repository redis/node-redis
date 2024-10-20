import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import DEL from './DEL';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('CF.DEL', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(DEL, 'key', 'item'),
      ['CF.DEL', 'key', 'item']
    );
  });

  testUtils.testWithClient('client.cf.del', async client => {
    const [, reply] = await Promise.all([
      client.cf.reserve('key', 4),
      client.cf.del('key', 'item')
    ]);

    assert.equal(reply, false);
  }, GLOBAL.SERVERS.OPEN);
});
