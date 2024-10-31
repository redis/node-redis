import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import XAUTOCLAIM from './XAUTOCLAIM';
import { parseArgs } from './generic-transformers';

describe('XAUTOCLAIM', () => {
  testUtils.isVersionGreaterThanHook([6, 2]);

  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(XAUTOCLAIM, 'key', 'group', 'consumer', 1, '0-0'),
        ['XAUTOCLAIM', 'key', 'group', 'consumer', '1', '0-0']
      );
    });

    it('with COUNT', () => {
      assert.deepEqual(
        parseArgs(XAUTOCLAIM, 'key', 'group', 'consumer', 1, '0-0', {
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

    const [, id1, id2, , , reply] = await Promise.all([
      client.xGroupCreate('key', 'group', '$', {
        MKSTREAM: true
      }),
      client.xAdd('key', '*', message),
      client.xAdd('key', '*', message),
      client.xReadGroup('group', 'consumer', {
        key: 'key',
        id: '>'
      }),
      client.xTrim('key', 'MAXLEN', 1),
      client.xAutoClaim('key', 'group', 'consumer', 0, '0-0')
    ]);

    assert.deepEqual(reply, {
      nextId: '0-0',
      ...(testUtils.isVersionGreaterThan([7, 0]) ? {
        messages: [{
          id: id2,
          message
        }],
        deletedMessages: [id1]
      } : {
        messages: [null, {
          id: id2,
          message
        }],
        deletedMessages: undefined
      })
    });
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
