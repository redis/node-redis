import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import LIST from './LIST';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TOPK.LIST', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(LIST, 'key'),
      ['TOPK.LIST', 'key']
    );
  });

  testUtils.testWithClient('client.topK.list', async client => {
    const [, reply] = await Promise.all([
      client.topK.reserve('key', 3),
      client.topK.list('key')
    ]);

    assert.deepEqual(reply, []);
  }, GLOBAL.SERVERS.OPEN);
});
