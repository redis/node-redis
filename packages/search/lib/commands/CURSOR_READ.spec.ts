import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import CURSOR_READ from './CURSOR_READ';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('FT.CURSOR READ', () => {
  describe('transformArguments', () => {
    it('without options', () => {
      assert.deepEqual(
        parseArgs(CURSOR_READ, 'index', '0'),
        ['FT.CURSOR', 'READ', 'index', '0']
      );
    });

    it('with COUNT', () => {
      assert.deepEqual(
        parseArgs(CURSOR_READ, 'index', '0', {
          COUNT: 1
        }),
        ['FT.CURSOR', 'READ', 'index', '0', 'COUNT', '1']
      );
    });
  });

  testUtils.testWithClient('client.ft.cursorRead', async client => {
    const [, , { cursor }] = await Promise.all([
      client.ft.create('idx', {
        field: 'TEXT'
      }),
      client.hSet('key', 'field', 'value'),
      client.ft.aggregateWithCursor('idx', '*', {
        COUNT: 1
      })
    ]);

    assert.deepEqual(
      await client.ft.cursorRead('idx', cursor),
      {
        total: 0,
        results: [],
        cursor: 0
      }
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('[RESP3] client.ft.cursorRead', async client => {
    const [, , cursorResult] = await Promise.all([
      client.ft.create('idx', {
        field: 'TEXT'
      }),
      client.hSet('key', 'field', 'value'),
      client.ft.aggregateWithCursor('idx', '*', {
        COUNT: 1
      })
    ]);

    // In RESP3, the raw response is returned (no transform) — extract cursor from the raw structure
    const cursor = (cursorResult as any).cursor ?? (Array.isArray(cursorResult) ? cursorResult[1] : 0);
    const reply = await client.ft.cursorRead('idx', cursor);
    assert.ok(typeof reply === 'object' && reply !== null);
  }, GLOBAL.SERVERS.OPEN);
});
