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

  testUtils.testWithClient('client.ft.aggregateWithCursor with data', async client => {
    await client.ft.create('index', {
      field: 'NUMERIC'
    });

    const reply = await client.ft.aggregateWithCursor('index', '*');

    // Transformed reply has { total, results, cursor }
    assert.equal(typeof reply.total, 'number');
    assert.ok(Array.isArray(reply.results));
    assert.equal(typeof reply.cursor, 'number');
    assert.equal(reply.total, 0);
    assert.deepEqual(reply.results, []);
    assert.equal(reply.cursor, 0);
  }, GLOBAL.SERVERS.OPEN);
});
