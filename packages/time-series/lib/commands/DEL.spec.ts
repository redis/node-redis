import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import DEL from './DEL';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TS.DEL', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(DEL, 'key', '-', '+'),
      ['TS.DEL', 'key', '-', '+']
    );
  });

  testUtils.testWithClient('client.ts.del', async client => {
    const [, reply] = await Promise.all([
      client.ts.create('key'),
      client.ts.del('key', '-', '+')
    ]);

    assert.equal(reply, 0);
  }, GLOBAL.SERVERS.OPEN);
});
