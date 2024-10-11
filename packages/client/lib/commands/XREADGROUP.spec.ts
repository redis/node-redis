import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import XREADGROUP from './XREADGROUP';

describe('XREADGROUP', () => {
  describe('FIRST_KEY_INDEX', () => {
    it('single stream', () => {
      assert.equal(
        XREADGROUP.FIRST_KEY_INDEX('', '', { key: 'key', id: '' }),
        'key'
      );
    });

    it('multiple streams', () => {
      assert.equal(
        XREADGROUP.FIRST_KEY_INDEX('', '', [{ key: '1', id: '' }, { key: '2', id: '' }]),
        '1'
      );
    });
  });

  describe('transformArguments', () => {
    it('single stream', () => {
      assert.deepEqual(
        XREADGROUP.transformArguments('group', 'consumer', {
          key: 'key',
          id: '0-0'
        }),
        ['XREADGROUP', 'GROUP', 'group', 'consumer', 'STREAMS', 'key', '0-0']
      );
    });

    it('multiple streams', () => {
      assert.deepEqual(
        XREADGROUP.transformArguments('group', 'consumer', [{
          key: '1',
          id: '0-0'
        }, {
          key: '2',
          id: '0-0'
        }]),
        ['XREADGROUP', 'GROUP', 'group', 'consumer', 'STREAMS', '1', '2', '0-0', '0-0']
      );
    });

    it('with COUNT', () => {
      assert.deepEqual(
        XREADGROUP.transformArguments('group', 'consumer', {
          key: 'key',
          id: '0-0'
        }, {
          COUNT: 1
        }),
        ['XREADGROUP', 'GROUP', 'group', 'consumer', 'COUNT', '1', 'STREAMS', 'key', '0-0']
      );
    });

    it('with BLOCK', () => {
      assert.deepEqual(
        XREADGROUP.transformArguments('group', 'consumer', {
          key: 'key',
          id: '0-0'
        }, {
          BLOCK: 0
        }),
        ['XREADGROUP', 'GROUP', 'group', 'consumer', 'BLOCK', '0', 'STREAMS', 'key', '0-0']
      );
    });

    it('with NOACK', () => {
      assert.deepEqual(
        XREADGROUP.transformArguments('group', 'consumer', {
          key: 'key',
          id: '0-0'
        }, {
          NOACK: true
        }),
        ['XREADGROUP', 'GROUP', 'group', 'consumer', 'NOACK', 'STREAMS', 'key', '0-0']
      );
    });

    it('with COUNT, BLOCK, NOACK', () => {
      assert.deepEqual(
        XREADGROUP.transformArguments('group', 'consumer', {
          key: 'key',
          id: '0-0'
        }, {
          COUNT: 1,
          BLOCK: 0,
          NOACK: true
        }),
        ['XREADGROUP', 'GROUP', 'group', 'consumer', 'COUNT', '1', 'BLOCK', '0', 'NOACK', 'STREAMS', 'key', '0-0']
      );
    });
  });

  testUtils.testAll('xReadGroup - null', async client => {
    const [, readGroupReply] = await Promise.all([
      client.xGroupCreate('key', 'group', '$', {
        MKSTREAM: true
      }),
      client.xReadGroup('group', 'consumer', {
        key: 'key',
        id: '>'
      })
    ]);

    assert.equal(readGroupReply, null);
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  testUtils.testAll('xReadGroup - with a message', async client => {
    const [, id, readGroupReply] = await Promise.all([
      client.xGroupCreate('key', 'group', '$', {
        MKSTREAM: true
      }),
      client.xAdd('key', '*', { field: 'value' }),
      client.xReadGroup('group', 'consumer', {
        key: 'key',
        id: '>'
      })
    ]);


    // FUTURE resp3 compatible
    const obj = Object.assign(Object.create(null), {
      'key': [{
        id: id,
        message: Object.create(null, {
          field: {
            value: 'value',
            configurable: true,
            enumerable: true
          }
        })
      }]
    });

    // v4 compatible
    const expected = [{
      name: 'key',
      messages: [{
        id: id,
        message: Object.assign(Object.create(null), {
          field: 'value'
        })
      }]
    }];

    assert.deepStrictEqual(readGroupReply, expected);
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
