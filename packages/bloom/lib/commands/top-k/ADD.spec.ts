import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import ADD from './ADD';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TOPK.ADD', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(ADD, 'key', 'item'),
      ['TOPK.ADD', 'key', 'item']
    );
  });

  testUtils.testWithClient('client.topK.add', async client => {
    const [, reply] = await Promise.all([
      client.topK.reserve('topK', 3),
      client.topK.add('topK', 'item')
    ]);

    assert.deepEqual(reply, [null]);
  }, GLOBAL.SERVERS.OPEN);
});
