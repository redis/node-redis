import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import XPENDING from './XPENDING';
import { parseArgs } from './generic-transformers';

describe('XPENDING', () => {
  describe('transformArguments', () => {
    it('transformArguments', () => {
      assert.deepEqual(
        parseArgs(XPENDING, 'key', 'group'),
        ['XPENDING', 'key', 'group']
      );
    });
  });

  describe('client.xPending', () => {
    testUtils.testWithClient('simple', async client => {
      const [, reply] = await Promise.all([
        client.xGroupCreate('key', 'group', '$', {
          MKSTREAM: true
        }),
        client.xPending('key', 'group')
      ]);

      assert.deepEqual(reply, {
        pending: 0,
        firstId: null,
        lastId: null,
        consumers: null
      });
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('with consumers', async client => {
      const [, , id, , reply] = await Promise.all([
        client.xGroupCreate('key', 'group', '$', {
          MKSTREAM: true
        }),
        client.xGroupCreateConsumer('key', 'group', 'consumer'),
        client.xAdd('key', '*', { field: 'value' }),
        client.xReadGroup('group', 'consumer', {
          key: 'key',
          id: '>'
        }),
        client.xPending('key', 'group')
      ]);

      assert.deepEqual(reply, {
        pending: 1,
        firstId: id,
        lastId: id,
        consumers: [{
          name: 'consumer',
          deliveriesCounter: 1
        }]
      });
    }, {
      ...GLOBAL.SERVERS.OPEN,
      minimumDockerVersion: [6, 2]
    });
  });
});
