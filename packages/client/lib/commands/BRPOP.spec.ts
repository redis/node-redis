import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL, BLOCKING_MIN_VALUE } from '../test-utils';
import BRPOP from './BRPOP';
import { parseArgs } from './generic-transformers';

describe('BRPOP', () => {
  describe('transformArguments', () => {
    it('single', () => {
      assert.deepEqual(
        parseArgs(BRPOP, 'key', 0),
        ['BRPOP', 'key', '0']
      );
    });

    it('multiple', () => {
      assert.deepEqual(
        parseArgs(BRPOP, ['1', '2'], 0),
        ['BRPOP', '1', '2', '0']
      );
    });
  });

  testUtils.testAll('brPop - null', async client => {
    assert.equal(
      await client.brPop('key', BLOCKING_MIN_VALUE),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  testUtils.testAll('brPopblPop - with member', async client => {
    const [, reply] = await Promise.all([
      client.lPush('key', 'element'),
      client.brPop('key', 1)
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
