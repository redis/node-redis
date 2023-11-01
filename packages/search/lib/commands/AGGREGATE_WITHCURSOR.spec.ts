import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import AGGREGATE_WITHCURSOR from './AGGREGATE_WITHCURSOR';

describe('AGGREGATE WITHCURSOR', () => {
  describe('transformArguments', () => {
    it('without options', () => {
      assert.deepEqual(
        AGGREGATE_WITHCURSOR.transformArguments('index', '*'),
        ['FT.AGGREGATE', 'index', '*', 'WITHCURSOR']
      );
    });

    it('with COUNT', () => {
      assert.deepEqual(
        AGGREGATE_WITHCURSOR.transformArguments('index', '*', {
          COUNT: 1
        }),
        ['FT.AGGREGATE', 'index', '*', 'WITHCURSOR', 'COUNT', '1']
      );
    });

    it('with MAXIDLE', () => {
      assert.deepEqual(
        AGGREGATE_WITHCURSOR.transformArguments('index', '*', {
          MAXIDLE: 1
        }),
        ['FT.AGGREGATE', 'index', '*', 'WITHCURSOR', 'MAXIDLE', '1']
      );
    });
  });

  testUtils.testWithClient('client.ft.aggregateWithCursor', async client => {
    await client.ft.create('index', {
      field: 'NUMERIC'
    });

    assert.deepEqual(
      await client.ft.aggregateWithCursor('index', '*'),
      {
        total: 0,
        results: [],
        cursor: 0
      }
    );
  }, GLOBAL.SERVERS.OPEN);
});
