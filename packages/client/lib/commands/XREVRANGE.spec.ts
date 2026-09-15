import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import XREVRANGE from './XREVRANGE';
import { parseArgs } from './generic-transformers';

describe('XREVRANGE', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(XREVRANGE, 'key', '-', '+'),
        ['XREVRANGE', 'key', '-', '+']
      );
    });

    it('with COUNT', () => {
      assert.deepEqual(
        parseArgs(XREVRANGE, 'key', '-', '+', {
          COUNT: 1
        }),
        ['XREVRANGE', 'key', '-', '+', 'COUNT', '1']
      );
    });

    it('with COUNT 0', () => {
      assert.deepEqual(
        parseArgs(XREVRANGE, 'key', '-', '+', {
          COUNT: 0
        }),
        ['XREVRANGE', 'key', '-', '+', 'COUNT', '0']
      );
    });
  });

  testUtils.testAll('xRevRange', async client => {
    const message = Object.defineProperties({}, {
      field: {
        value: 'value',
        enumerable: true
      }
    });

    const [id, reply] = await Promise.all([
      client.xAdd('key', '*', message),
      client.xRange('key', '-', '+')
    ]);

    assert.deepEqual(reply, [{
      id,
      message
    }]);
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  testUtils.testAll('xRevRange with COUNT 0', async client => {
    const message = Object.defineProperties({}, {
      field: {
        value: 'value',
        enumerable: true
      }
    });

    const id = await client.xAdd('key', '*', message);

    assert.equal(
      await client.xRevRange('key', '+', '-', { COUNT: 0 }),
      null
    );

    assert.deepEqual(
      await client.xRevRange('key', '+', '-', { COUNT: 1 }),
      [{ id, message }]
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
