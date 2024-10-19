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
});
