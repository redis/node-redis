import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import XREVRANGE from './XREVRANGE';

describe('XREVRANGE', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        XREVRANGE.transformArguments('key', '-', '+'),
        ['XREVRANGE', 'key', '-', '+']
      );
    });

    it('with COUNT', () => {
      assert.deepEqual(
        XREVRANGE.transformArguments('key', '-', '+', {
          COUNT: 1
        }),
        ['XREVRANGE', 'key', '-', '+', 'COUNT', '1']
      );
    });
  });

  testUtils.testAll('xRevRange', async client => {
    const message = Object.create(null, {
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
});
