import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ARGREP, { ArGrepPredicate } from './ARGREP';
import { parseArgs } from './generic-transformers';

describe('ARGREP', () => {
  describe('transformArguments', () => {
    it('single predicate', () => {
      assert.deepEqual(
        parseArgs(ARGREP, 'key', 0, 10, [['EXACT', 'boot']]),
        ['ARGREP', 'key', '0', '10', 'EXACT', 'boot']
      );
    });

    it('multiple predicates', () => {
      assert.deepEqual(
        parseArgs(ARGREP, 'key', 0, 10, [['MATCH', 'warn'], ['MATCH', 'error']]),
        ['ARGREP', 'key', '0', '10', 'MATCH', 'warn', 'MATCH', 'error']
      );
    });

    it('with COMBINATOR', () => {
      assert.deepEqual(
        parseArgs(ARGREP, 'key', 0, 10, [['MATCH', 'a'], ['MATCH', 'b']], { COMBINATOR: 'AND' }),
        ['ARGREP', 'key', '0', '10', 'MATCH', 'a', 'MATCH', 'b', 'AND']
      );
    });

    it('with LIMIT, NOCASE', () => {
      assert.deepEqual(
        parseArgs(ARGREP, 'key', 0, 10, [['MATCH', 'error']], {
          LIMIT: 5,
          NOCASE: true
        }),
        ['ARGREP', 'key', '0', '10', 'MATCH', 'error', 'LIMIT', '5', 'NOCASE']
      );
    });

    it('open-ended bounds (- and +)', () => {
      assert.deepEqual(
        parseArgs(ARGREP, 'key', '-', '+', [['EXACT', 'boot']]),
        ['ARGREP', 'key', '-', '+', 'EXACT', 'boot']
      );
    });

    it('mixed bounds (concrete + open)', () => {
      assert.deepEqual(
        parseArgs(ARGREP, 'key', 5, '+', [['EXACT', 'boot']]),
        ['ARGREP', 'key', '5', '+', 'EXACT', 'boot']
      );
      assert.deepEqual(
        parseArgs(ARGREP, 'key', '-', 10, [['EXACT', 'boot']]),
        ['ARGREP', 'key', '-', '10', 'EXACT', 'boot']
      );
    });
  });

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arGrep', async client => {
    await client.arMSet('key', { 0: 'boot', 1: 'warn', 2: 'error', 3: 'boot' });
    assert.deepEqual(
      await client.arGrep('key', 0, 3, [['EXACT', 'boot']]),
      [0, 3]
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arGrep with open-ended bounds', async client => {
    await client.arMSet('key', { 0: 'boot', 1: 'warn', 2: 'error', 3: 'boot' });
    assert.deepEqual(
      await client.arGrep('key', '-', '+', [['EXACT', 'boot']]),
      [0, 3]
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arGrep with mixed bounds', async client => {
    await client.arMSet('key', { 0: 'boot', 1: 'warn', 2: 'error', 3: 'boot' });
    assert.deepEqual(
      await client.arGrep('key', 1, '+', [['EXACT', 'boot']]),
      [3]
    );
    assert.deepEqual(
      await client.arGrep('key', '-', 2, [['EXACT', 'boot']]),
      [0]
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arGrep MATCH on sparse', async client => {
    await client.arMSet('key', [[0, 'alpha'], [1, 'beta'], [2, 'alphabet'], [5, 'gamma']]);
    assert.deepEqual(
      await client.arGrep('key', '-', '+', [['MATCH', 'alpha']]),
      [0, 2]
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arGrep AND + GLOB + NOCASE', async client => {
    await client.arMSet('key', [
      [0, 'RedisArray'],
      [1, 'redis-match'],
      [2, 'array-only'],
      [3, 'plain']
    ]);
    assert.deepEqual(
      await client.arGrep('key', '-', '+', [['MATCH', 'redis'], ['GLOB', '*array*']], {
        COMBINATOR: 'AND',
        NOCASE: true
      }),
      [0]
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arGrep LIMIT stops after N', async client => {
    await client.arMSet('key', [[0, 'hit-1'], [1, 'hit-2'], [2, 'miss'], [3, 'hit-3']]);
    assert.deepEqual(
      await client.arGrep('key', '-', '+', [['MATCH', 'hit']], { LIMIT: 2 }),
      [0, 1]
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arGrep missing key returns empty', async client => {
    assert.deepEqual(
      await client.arGrep('missing', '-', '+', [['MATCH', 'foo']]),
      []
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arGrep RE basic match', async client => {
    await client.arMSet('key', [[0, 'foo123'], [1, 'bar'], [2, 'zoo999'], [3, 'Foo777']]);
    assert.deepEqual(
      await client.arGrep('key', '-', '+', [['RE', '^.*[0-9]{3}$']]),
      [0, 2, 3]
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arGrep RE NOCASE', async client => {
    await client.arMSet('key', [[0, 'foo123'], [1, 'bar'], [2, 'zoo999'], [3, 'Foo777']]);
    assert.deepEqual(
      await client.arGrep('key', '-', '+', [['RE', '^foo[0-9]+$']], { NOCASE: true }),
      [0, 3]
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arGrep RE rejects oversize, backrefs, empty', async client => {
    const re2048 = 'a'.repeat(2048);
    const re2049 = 'a'.repeat(2049);
    assert.equal(await client.arSet('key', 0, re2048), 1);
    assert.deepEqual(await client.arGrep('key', '-', '+', [['RE', re2048]]), [0]);
    await assert.rejects(() => client.arGrep('key', '-', '+', [['RE', re2049]]), /maximum is 2048 bytes/i);
    await assert.rejects(() => client.arGrep('key', '-', '+', [['RE', '(a)\\1']]), /backreferences are not supported/i);
    await assert.rejects(() => client.arGrep('key', '-', '+', [['RE', '']]), /regular expression is empty/i);
    await assert.rejects(() => client.arGrep('key', '-', '+', [['RE', '\\x{1']]), /invalid regular expression/i);
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arGrep enforces predicate limit (250 ok, 251 errors)', async client => {
    assert.equal(await client.arSet('key', 0, 'foo'), 1);
    const preds250: Array<ArGrepPredicate> = Array.from({ length: 250 }, () => ['MATCH', 'foo']);
    assert.deepEqual(await client.arGrep('key', '-', '+', preds250), [0]);
    const preds251: Array<ArGrepPredicate> = Array.from({ length: 251 }, () => ['MATCH', 'foo']);
    await assert.rejects(() => client.arGrep('key', '-', '+', preds251), /maximum is 250/i);
  }, GLOBAL.SERVERS.OPEN);
});
