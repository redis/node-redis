import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import LIST_WITHCOUNT from './LIST_WITHCOUNT';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TOPK.LIST WITHCOUNT', () => {
  testUtils.isVersionGreaterThanHook([2, 2, 9]);

  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(LIST_WITHCOUNT, 'key'),
      ['TOPK.LIST', 'key', 'WITHCOUNT']
    );
  });

  testUtils.testWithClient('client.topK.listWithCount', async client => {
    const [, , list] = await Promise.all([
      client.topK.reserve('key', 3),
      client.topK.add('key', 'item'),
      client.topK.listWithCount('key')
    ]);

    assert.deepEqual(list, [{
      item: 'item',
      count: 1
    }]);
  }, GLOBAL.SERVERS.OPEN);
});
