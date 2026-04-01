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

    assert.deepStrictEqual(reply, expected);
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  testUtils.testWithClient('client.xRead should throw with resp3 and unstableResp3: false', async client => {
    assert.throws(
      () => client.xRead({
        key: 'key',
        id: '0-0'
      }),
      {
        message: 'Some RESP3 results for Redis Query Engine responses may change. Refer to the readme for guidance'
      }
    );
  }, {
    ...GLOBAL.SERVERS.OPEN,
    clientOptions: {
      RESP: 3
    }
  });

  testUtils.testWithClient('client.xRead should not throw with resp3 and unstableResp3: true', async client => {
    assert.doesNotThrow(
      () => client.xRead({
        key: 'key',
        id: '0-0'
      })
    );
  }, {
    ...GLOBAL.SERVERS.OPEN,
    clientOptions: {
      RESP: 3,
      unstableResp3: true
    }
  });

});
