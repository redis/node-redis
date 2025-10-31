import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL, parseFirstKey } from '../test-utils';
import XREADGROUP from './XREADGROUP';
import { parseArgs } from './generic-transformers';

describe('XREADGROUP', () => {
  describe('FIRST_KEY_INDEX', () => {
    it('single stream', () => {
      assert.equal(
        parseFirstKey(XREADGROUP, '', '', { key: 'key', id: '' }),
        'key'
      );
    });

    it('multiple streams', () => {
      assert.equal(
        parseFirstKey(XREADGROUP, '', '', [{ key: '1', id: '' }, { key: '2', id: '' }]),
        '1'
      );
    });
  });

  describe('transformArguments', () => {
    it('single stream', () => {
      assert.deepEqual(
        parseArgs(XREADGROUP, 'group', 'consumer', {
          key: 'key',
          id: '0-0'
        }),
        ['XREADGROUP', 'GROUP', 'group', 'consumer', 'STREAMS', 'key', '0-0']
      );
    });

    it('multiple streams', () => {
      assert.deepEqual(
        parseArgs(XREADGROUP, 'group', 'consumer', [{
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
        parseArgs(XREADGROUP, 'group', 'consumer', {
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
        parseArgs(XREADGROUP, 'group', 'consumer', {
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
        parseArgs(XREADGROUP, 'group', 'consumer', {
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
        parseArgs(XREADGROUP, 'group', 'consumer', {
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

    it('with CLAIM', () => {
      assert.deepEqual(
        parseArgs(XREADGROUP, 'group', 'consumer', {
          key: 'key',
          id: '0-0'
        }, {
          CLAIM: 100
        }),
        ['XREADGROUP', 'GROUP', 'group', 'consumer', 'CLAIM', '100', 'STREAMS', 'key', '0-0']
      );
    });

    it('with COUNT, BLOCK, NOACK, CLAIM', () => {
      assert.deepEqual(
        parseArgs(XREADGROUP, 'group', 'consumer', {
          key: 'key',
          id: '0-0'
        }, {
          COUNT: 1,
          BLOCK: 0,
          NOACK: true,
          CLAIM: 100
        }),
        ['XREADGROUP', 'GROUP', 'group', 'consumer', 'COUNT', '1', 'BLOCK', '0', 'NOACK', 'CLAIM', '100', 'STREAMS', 'key', '0-0']
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

  testUtils.testAll('xReadGroup - without CLAIM should not include delivery fields', async client => {
    const [, id] = await Promise.all([
      client.xGroupCreate('key', 'group', '$', {
        MKSTREAM: true
      }),
      client.xAdd('key', '*', { field: 'value' })
    ]);

    const readGroupReply = await client.xReadGroup('group', 'consumer', {
      key: 'key',
      id: '>'
    });

    assert.ok(readGroupReply);
    assert.equal(readGroupReply[0].messages[0].millisElapsedFromDelivery, undefined);
    assert.equal(readGroupReply[0].messages[0].deliveriesCounter, undefined);
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  testUtils.testWithClientIfVersionWithinRange([[8,4], 'LATEST'],'xReadGroup - with CLAIM should include delivery fields', async client => {
    const [, id] = await Promise.all([
      client.xGroupCreate('key', 'group', '$', {
        MKSTREAM: true
      }),
      client.xAdd('key', '*', { field: 'value' })
    ]);

    // First read to add message to PEL
    await client.xReadGroup('group', 'consumer', {
      key: 'key',
      id: '>'
    });

    // Read with CLAIM to get delivery fields
    const readGroupReply = await client.xReadGroup('group', 'consumer2', {
      key: 'key',
      id: '>'
    }, {
      CLAIM: 0
    });

    assert.ok(readGroupReply);
    assert.equal(readGroupReply[0].messages[0].id, id);
    assert.ok(readGroupReply[0].messages[0].millisElapsedFromDelivery !== undefined);
    assert.ok(readGroupReply[0].messages[0].deliveriesCounter !== undefined);
    assert.equal(typeof readGroupReply[0].messages[0].millisElapsedFromDelivery, 'number');
    assert.equal(typeof readGroupReply[0].messages[0].deliveriesCounter, 'number');
  }, GLOBAL.SERVERS.OPEN);
});
