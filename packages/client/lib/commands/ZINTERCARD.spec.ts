import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ZINTERCARD from './ZINTERCARD';
import { parseArgs } from './generic-transformers';

describe('ZINTERCARD', () => {
  testUtils.isVersionGreaterThanHook([7]);

  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(ZINTERCARD, ['1', '2']),
        ['ZINTERCARD', '2', '1', '2']
      );
    });

    describe('with LIMIT', () => {
      it('plain number (backwards compatibility)', () => {
        assert.deepEqual(
          parseArgs(ZINTERCARD, ['1', '2'], 1),
          ['ZINTERCARD', '2', '1', '2', 'LIMIT', '1']
        );
      });

      it('{ LIMIT: number }', () => {
        assert.deepEqual(
          parseArgs(ZINTERCARD, ['1', '2'], {
            LIMIT: 1
          }),
          ['ZINTERCARD', '2', '1', '2', 'LIMIT', '1']
        );
      });
    });
  });

  testUtils.testAll('zInterCard', async client => {
    assert.deepEqual(
      await client.zInterCard('key'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
