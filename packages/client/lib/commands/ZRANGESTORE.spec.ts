import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ZRANGESTORE from './ZRANGESTORE';
import { parseArgs } from './generic-transformers';

describe('ZRANGESTORE', () => {
  testUtils.isVersionGreaterThanHook([6, 2]);

  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(ZRANGESTORE, 'destination', 'source', 0, 1),
        ['ZRANGESTORE', 'destination', 'source', '0', '1']
      );
    });

    it('with BYSCORE', () => {
      assert.deepEqual(
        parseArgs(ZRANGESTORE, 'destination', 'source', 0, 1, {
          BY: 'SCORE'
        }),
        ['ZRANGESTORE', 'destination', 'source', '0', '1', 'BYSCORE']
      );
    });

    it('with BYLEX', () => {
      assert.deepEqual(
        parseArgs(ZRANGESTORE, 'destination', 'source', 0, 1, {
          BY: 'LEX'
        }),
        ['ZRANGESTORE', 'destination', 'source', '0', '1', 'BYLEX']
      );
    });

    it('with REV', () => {
      assert.deepEqual(
        parseArgs(ZRANGESTORE, 'destination', 'source', 0, 1, {
          REV: true
        }),
        ['ZRANGESTORE', 'destination', 'source', '0', '1', 'REV']
      );
    });

    it('with LIMIT', () => {
      assert.deepEqual(
        parseArgs(ZRANGESTORE, 'destination', 'source', 0, 1, {
          LIMIT: {
            offset: 0,
            count: 1
          }
        }),
        ['ZRANGESTORE', 'destination', 'source', '0', '1', 'LIMIT', '0', '1']
      );
    });

    it('with BY & REV & LIMIT', () => {
      assert.deepEqual(
        parseArgs(ZRANGESTORE, 'destination', 'source', 0, 1, {
          BY: 'SCORE',
          REV: true,
          LIMIT: {
            offset: 0,
            count: 1
          }
        }),
        ['ZRANGESTORE', 'destination', 'source', '0', '1', 'BYSCORE', 'REV', 'LIMIT', '0', '1']
      );
    });
  });

  testUtils.testWithClient('client.zRangeStore', async client => {
    const [, reply] = await Promise.all([
      client.zAdd('{tag}source', {
        score: 1,
        value: '1'
      }),
      client.zRangeStore('{tag}destination', '{tag}source', 0, 1)
    ]);

    assert.equal(reply, 1);
  }, GLOBAL.SERVERS.OPEN);
});
