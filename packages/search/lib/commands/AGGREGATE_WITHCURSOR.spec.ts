import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import AGGREGATE_WITHCURSOR from './AGGREGATE_WITHCURSOR';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';
import { DEFAULT_DIALECT } from '../dialect/default';

describe('AGGREGATE WITHCURSOR', () => {
  describe('transformArguments', () => {
    it('without options', () => {
      assert.deepEqual(
        parseArgs(AGGREGATE_WITHCURSOR, 'index', '*'),
        ['FT.AGGREGATE', 'index', '*', 'DIALECT', DEFAULT_DIALECT, 'WITHCURSOR']
      );
    });

    it('with COUNT', () => {
      assert.deepEqual(
        parseArgs(AGGREGATE_WITHCURSOR, 'index', '*', {
          COUNT: 1
        }),
        ['FT.AGGREGATE', 'index', '*', 'DIALECT', DEFAULT_DIALECT, 'WITHCURSOR', 'COUNT', '1']
      );
    });

    it('with MAXIDLE', () => {
      assert.deepEqual(
        parseArgs(AGGREGATE_WITHCURSOR, 'index', '*', {
          MAXIDLE: 1
        }),
        ['FT.AGGREGATE', 'index', '*', 'DIALECT', DEFAULT_DIALECT, 'WITHCURSOR', 'MAXIDLE', '1']
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

  testUtils.testWithClient('[RESP3] client.ft.aggregateWithCursor', async client => {
    await client.ft.create('index', {
      field: 'NUMERIC'
    });

    const reply: any = await client.ft.aggregateWithCursor('index', '*');

    // RESP3 returns [Map, cursor] instead of RESP2's [Array, cursor]
    // The aggregate result is a Map with total_results, results, etc. instead of a flat Array
    assert.ok(Array.isArray(reply));
    assert.equal(reply.length, 2);
    assert.ok(reply[0] !== null && typeof reply[0] === 'object');
    assert.ok('total_results' in reply[0]);
    assert.ok('results' in reply[0]);
    assert.equal(typeof reply[1], 'number'); // cursor
  }, GLOBAL.SERVERS.OPEN);
});
