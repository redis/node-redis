import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import XRANGE from './XRANGE';
import { parseArgs } from './generic-transformers';

describe('XRANGE', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(XRANGE, 'key', '-', '+'),
        ['XRANGE', 'key', '-', '+']
      );
    });

    it('with COUNT', () => {
      assert.deepEqual(
        parseArgs(XRANGE, 'key', '-', '+', {
          COUNT: 1
        }),
        ['XRANGE', 'key', '-', '+', 'COUNT', '1']
      );
    });

    it('with COUNT 0', () => {
      assert.deepEqual(
        parseArgs(XRANGE, 'key', '-', '+', {
          COUNT: 0
        }),
        ['XRANGE', 'key', '-', '+', 'COUNT', '0']
      );
    });
  });

  testUtils.testAll('xRange', async client => {
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

  testUtils.testAll('xRange with COUNT 0', async client => {
    const message = Object.defineProperties({}, {
      field: {
        value: 'value',
        enumerable: true
      }
    });

    const id = await client.xAdd('key', '*', message);

    assert.equal(
      await client.xRange('key', '-', '+', { COUNT: 0 }),
      null
    );

    assert.deepEqual(
      await client.xRange('key', '-', '+', { COUNT: 1 }),
      [{ id, message }]
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
