import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import INCRBY from './INCRBY';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TOPK.INCRBY', () => {
  describe('transformArguments', () => {
    it('single item', () => {
      assert.deepEqual(
        parseArgs(INCRBY, 'key', {
          item: 'item',
          incrementBy: 1
        }),
        ['TOPK.INCRBY', 'key', 'item', '1']
      );
    });

    it('multiple items', () => {
      assert.deepEqual(
        parseArgs(INCRBY, 'key', [{
          item: 'a',
          incrementBy: 1
        }, {
          item: 'b',
          incrementBy: 2
        }]),
        ['TOPK.INCRBY', 'key', 'a', '1', 'b', '2']
      );
    });
  });

  testUtils.testWithClient('client.topK.incrby', async client => {
    const [, reply] = await Promise.all([
      client.topK.reserve('key', 5),
      client.topK.incrBy('key', {
        item: 'item',
        incrementBy: 1
      })
    ]);

    assert.deepEqual(reply, [null]);
  }, GLOBAL.SERVERS.OPEN);
});
