import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import INCRBY from './INCRBY';

describe('CMS.INCRBY', () => {
  describe('transformArguments', () => {
    it('single item', () => {
      assert.deepEqual(
        INCRBY.transformArguments('key', {
          item: 'item',
          incrementBy: 1
        }),
        ['CMS.INCRBY', 'key', 'item', '1']
      );
    });

    it('multiple items', () => {
      assert.deepEqual(
        INCRBY.transformArguments('key', [{
          item: 'a',
          incrementBy: 1
        }, {
          item: 'b',
          incrementBy: 2
        }]),
        ['CMS.INCRBY', 'key', 'a', '1', 'b', '2']
      );
    });
  });

  testUtils.testWithClient('client.cms.incrBy', async client => {
    const [, reply] = await Promise.all([
      client.cms.initByDim('key', 1000, 5),
      client.cms.incrBy('key', {
        item: 'item',
        incrementBy: 1
      })
    ]);

    assert.deepEqual(reply, [1]);
  }, GLOBAL.SERVERS.OPEN);
});
