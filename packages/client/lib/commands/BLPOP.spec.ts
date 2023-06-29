import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import BLPOP from './BLPOP';

describe('BLPOP', () => {
  describe('transformArguments', () => {
    it('single', () => {
      assert.deepEqual(
        BLPOP.transformArguments('key', 0),
        ['BLPOP', 'key', '0']
      );
    });

    it('multiple', () => {
      assert.deepEqual(
        BLPOP.transformArguments(['1', '2'], 0),
        ['BLPOP', '1', '2', '0']
      );
    });
  });

  testUtils.testAll('blPop - null', async client => {
    assert.equal(
      await client.blPop('key', Number.MIN_VALUE),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  testUtils.testAll('blPop - with member', async client => {
    const [, reply] = await Promise.all([
      client.lPush('key', 'element'),
      client.blPop('key', 1)
    ]);

    assert.deepEqual(reply, {
      key: 'key',
      element: 'element'
    });
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
