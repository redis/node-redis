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

  testUtils.testWithClient('xReadGroup - with a message and data', async client => {
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

    // RESP3 returns a Map reply instead of Array reply
    // With no transformReply for RESP3, the raw map-like response is returned
    assert.ok(readGroupReply !== null, 'readGroupReply should not be null');

    // The response should be a map-like structure (Object with null prototype or Map)
    // with stream name as key and array of messages as value
    if (readGroupReply instanceof Map) {
      const messages = readGroupReply.get('key');
      assert.ok(Array.isArray(messages));
      assert.equal(messages.length, 1);
      assert.equal(messages[0].id ?? messages[0][0], id);
    } else if (Array.isArray(readGroupReply)) {
      // If transform normalizes to array format
      assert.equal(readGroupReply[0].name, 'key');
      assert.equal(readGroupReply[0].messages[0].id, id);
    } else {
      // Object with null prototype
      const messages = (readGroupReply as any)['key'] ?? (readGroupReply as any).key;
      assert.ok(messages, 'should have messages for key');
    }
  }, GLOBAL.SERVERS.OPEN);

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
