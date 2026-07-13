import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL, parseFirstKey } from '../test-utils';
import XREAD from './XREAD';
import { parseArgs } from './generic-transformers';

describe('XREAD', () => {
  describe('FIRST_KEY_INDEX', () => {
    it('single stream', () => {
      assert.equal(
        parseFirstKey(XREAD, {
          key: 'key',
          id: ''
        }),
        'key'
      );
    });

    it('multiple streams', () => {
      assert.equal(
        parseFirstKey(XREAD, [{
          key: '1',
          id: ''
        }, {
          key: '2',
          id: ''
        }]),
        '1'
      );
    });
  });

  describe('transformArguments', () => {
    it('single stream', () => {
      assert.deepEqual(
        parseArgs(XREAD, {
          key: 'key',
          id: '0-0'
        }),
        ['XREAD', 'STREAMS', 'key', '0-0']
      );
    });

    it('multiple streams', () => {
      assert.deepEqual(
        parseArgs(XREAD, [{
          key: '1',
          id: '0-0'
        }, {
          key: '2',
          id: '0-0'
        }]),
        ['XREAD', 'STREAMS', '1', '2', '0-0', '0-0']
      );
    });

    it('with COUNT', () => {
      assert.deepEqual(
        parseArgs(XREAD, {
          key: 'key',
          id: '0-0'
        }, {
          COUNT: 1
        }),
        ['XREAD', 'COUNT', '1', 'STREAMS', 'key', '0-0']
      );
    });

    it('with BLOCK', () => {
      assert.deepEqual(
        parseArgs(XREAD, {
          key: 'key',
          id: '0-0'
        }, {
          BLOCK: 0
        }),
        ['XREAD', 'BLOCK', '0', 'STREAMS', 'key', '0-0']
      );
    });

    it('with COUNT, BLOCK', () => {
      assert.deepEqual(
        parseArgs(XREAD, {
          key: 'key',
          id: '0-0'
        }, {
          COUNT: 1,
          BLOCK: 0
        }),
        ['XREAD', 'COUNT', '1', 'BLOCK', '0', 'STREAMS', 'key', '0-0']
      );
    });

    it('with MAXCOUNT', () => {
      assert.deepEqual(
        parseArgs(XREAD, {
          key: 'key',
          id: '0-0'
        }, {
          MAXCOUNT: 3
        }),
        ['XREAD', 'MAXCOUNT', '3', 'STREAMS', 'key', '0-0']
      );
    });

    it('with MAXSIZE', () => {
      assert.deepEqual(
        parseArgs(XREAD, {
          key: 'key',
          id: '0-0'
        }, {
          MAXSIZE: 65536
        }),
        ['XREAD', 'MAXSIZE', '65536', 'STREAMS', 'key', '0-0']
      );
    });

    it('with COUNT, MAXCOUNT, MAXSIZE, BLOCK', () => {
      assert.deepEqual(
        parseArgs(XREAD, {
          key: 'key',
          id: '0-0'
        }, {
          COUNT: 2,
          MAXCOUNT: 3,
          MAXSIZE: 65536,
          BLOCK: 0
        }),
        ['XREAD', 'COUNT', '2', 'MAXCOUNT', '3', 'MAXSIZE', '65536', 'BLOCK', '0', 'STREAMS', 'key', '0-0']
      );
    });
  });

  testUtils.testAll('client.xRead', async client => {
    const message = { field: 'value' },
    [id, reply] = await Promise.all([
      client.xAdd('key', '*', message),
      client.xRead({
        key: 'key',
        id: '0-0'
      }),
    ])

    // FUTURE resp3 compatible
    const _obj = Object.assign({}, {
      'key': [{
        id: id,
        message: Object.defineProperties({}, {
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
        message: Object.assign({}, {
          field: 'value'
        })
      }]
    }];

    assert.deepStrictEqual(reply, expected);
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  testUtils.testWithClient('client.xRead should not throw with resp3', async client => {
    assert.doesNotThrow(
      () => client.xRead({
        key: 'key',
        id: '0-0'
      })
    );
  }, {
    ...GLOBAL.SERVERS.OPEN,
    clientOptions: {
      RESP: 3
    }
  });

  testUtils.testWithClientIfVersionWithinRange([[8, 10], 'LATEST'], 'client.xRead with MAXCOUNT caps entries cumulatively across streams', async client => {
    await Promise.all([
      client.xAdd('{t}s1', '1-0', { field: 'v1' }),
      client.xAdd('{t}s1', '2-0', { field: 'v2' }),
      client.xAdd('{t}s2', '1-0', { field: 'v3' }),
      client.xAdd('{t}s2', '2-0', { field: 'v4' })
    ]);

    const reply = await client.xRead([
      { key: '{t}s1', id: '0' },
      { key: '{t}s2', id: '0' }
    ], {
      MAXCOUNT: 3
    });

    assert.ok(reply);
    const total = reply.reduce((sum, stream) => sum + stream.messages.length, 0);
    assert.equal(total, 3);
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientIfVersionWithinRange([[8, 10], 'LATEST'], 'client.xRead with MAXSIZE caps reply size cumulatively across streams', async client => {
    await Promise.all([
      client.xAdd('{t}s1', '1-0', { field: 'v1' }),
      client.xAdd('{t}s1', '2-0', { field: 'v2' }),
      client.xAdd('{t}s2', '1-0', { field: 'v3' }),
      client.xAdd('{t}s2', '2-0', { field: 'v4' })
    ]);

    // MAXSIZE is a soft cumulative byte cap across all streams; the server always
    // returns at least one entry, so MAXSIZE of 1 byte yields exactly one entry total.
    const reply = await client.xRead([
      { key: '{t}s1', id: '0' },
      { key: '{t}s2', id: '0' }
    ], {
      MAXSIZE: 1
    });

    assert.ok(reply);
    const total = reply.reduce((sum, stream) => sum + stream.messages.length, 0);
    assert.equal(total, 1);
  }, GLOBAL.SERVERS.OPEN);

});
