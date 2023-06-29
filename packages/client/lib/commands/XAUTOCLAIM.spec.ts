import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import XAUTOCLAIM from './XAUTOCLAIM';

describe('XAUTOCLAIM', () => {
  testUtils.isVersionGreaterThanHook([6, 2]);

  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        XAUTOCLAIM.transformArguments('key', 'group', 'consumer', 1, '0-0'),
        ['XAUTOCLAIM', 'key', 'group', 'consumer', '1', '0-0']
      );
    });

    it('with COUNT', () => {
      assert.deepEqual(
        XAUTOCLAIM.transformArguments('key', 'group', 'consumer', 1, '0-0', {
          COUNT: 1
        }),
        ['XAUTOCLAIM', 'key', 'group', 'consumer', '1', '0-0', 'COUNT', '1']
      );
    });
  });

  testUtils.testAll('xAutoClaim', async client => {
    const message = Object.create(null, {
      field: {
        value: 'value',
        enumerable: true
      }
    });

    const [, , id, , reply] = await Promise.all([
      client.xGroupCreate('key', 'group', '$', {
        MKSTREAM: true
      }),
      client.xGroupCreateConsumer('key', 'group', 'consumer'),
      client.xAdd('key', '*', message),
      client.xReadGroup('group', 'consumer', {
        key: 'key',
        id: '>'
      }),
      client.xAutoClaim('key', 'group', 'consumer', 0, '0-0')
    ]);

    assert.deepEqual(reply, {
      nextId: '0-0',
      messages: [{
        id,
        message
      }],
      deletedMessages: testUtils.isVersionGreaterThan([7, 0]) ? [] : undefined
    });
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
