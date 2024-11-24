import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import XTRIM from './XTRIM';
import { parseArgs } from './generic-transformers';

describe('XTRIM', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(XTRIM, 'key', 'MAXLEN', 1),
        ['XTRIM', 'key', 'MAXLEN', '1']
      );
    });

    it('with strategyModifier', () => {
      assert.deepEqual(
        parseArgs(XTRIM, 'key', 'MAXLEN', 1, {
          strategyModifier: '='
        }),
        ['XTRIM', 'key', 'MAXLEN', '=', '1']
      );
    });

    it('with LIMIT', () => {
      assert.deepEqual(
        parseArgs(XTRIM, 'key', 'MAXLEN', 1, {
          LIMIT: 1
        }),
        ['XTRIM', 'key', 'MAXLEN', '1', 'LIMIT', '1']
      );
    });

    it('with strategyModifier, LIMIT', () => {
      assert.deepEqual(
        parseArgs(XTRIM, 'key', 'MAXLEN', 1, {
          strategyModifier: '=',
          LIMIT: 1
        }),
        ['XTRIM', 'key', 'MAXLEN', '=', '1', 'LIMIT', '1']
      );
    });
  });

  testUtils.testAll('xTrim', async client => {
    assert.equal(
      await client.xTrim('key', 'MAXLEN', 1),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN,
  });
});
