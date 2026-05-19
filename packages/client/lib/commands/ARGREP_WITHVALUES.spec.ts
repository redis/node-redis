import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ARGREP_WITHVALUES from './ARGREP_WITHVALUES';
import { parseArgs } from './generic-transformers';

describe('ARGREP WITHVALUES', () => {
  describe('transformArguments', () => {
    it('single predicate', () => {
      assert.deepEqual(
        parseArgs(ARGREP_WITHVALUES, 'key', 0, 10, [['EXACT', 'boot']]),
        ['ARGREP', 'key', '0', '10', 'EXACT', 'boot', 'WITHVALUES']
      );
    });

    it('with options', () => {
      assert.deepEqual(
        parseArgs(ARGREP_WITHVALUES, 'key', 0, 10, [['MATCH', 'a'], ['MATCH', 'b']], {
          COMBINATOR: 'AND',
          LIMIT: 5,
          NOCASE: true
        }),
        ['ARGREP', 'key', '0', '10', 'MATCH', 'a', 'MATCH', 'b', 'AND', 'LIMIT', '5', 'NOCASE', 'WITHVALUES']
      );
    });
  });

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arGrepWithValues', async client => {
    await client.arMSet('key', { 0: 'boot', 1: 'warn', 2: 'error', 3: 'boot' });
    assert.deepEqual(
      await client.arGrepWithValues('key', 0, 3, [['EXACT', 'boot']]),
      [
        { index: 0, value: 'boot' },
        { index: 3, value: 'boot' }
      ]
    );
  }, GLOBAL.SERVERS.OPEN);

  // Confirms the server accepts our emitted ordering of trailing modifiers:
  // <predicates> COMBINATOR LIMIT N NOCASE WITHVALUES
  // .NET emits AND/NOCASE/WITHVALUES/LIMIT instead; tcl claims order-insensitive.
  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arGrepWithValues with COMBINATOR + LIMIT + NOCASE', async client => {
    await client.arMSet('key', {
      0: 'RedisArray',
      1: 'redis-match',
      2: 'array-only',
      3: 'plain',
      4: 'redis-array-extra'
    });
    const result = await client.arGrepWithValues(
      'key',
      0,
      4,
      [['MATCH', 'redis'], ['GLOB', '*array*']],
      { COMBINATOR: 'AND', LIMIT: 5, NOCASE: true }
    );
    assert.deepEqual(result, [
      { index: 0, value: 'RedisArray' },
      { index: 4, value: 'redis-array-extra' }
    ]);
  }, GLOBAL.SERVERS.OPEN);
});
