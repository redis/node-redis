import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ARINSERT from './ARINSERT';
import { parseArgs } from './generic-transformers';

describe('ARINSERT', () => {
  describe('transformArguments', () => {
    it('single value', () => {
      assert.deepEqual(
        parseArgs(ARINSERT, 'key', 'v0'),
        ['ARINSERT', 'key', 'v0']
      );
    });

    it('multiple values', () => {
      assert.deepEqual(
        parseArgs(ARINSERT, 'key', ['v0', 'v1', 'v2']),
        ['ARINSERT', 'key', 'v0', 'v1', 'v2']
      );
    });
  });

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arInsert advances write head', async client => {
    assert.equal(await client.arInsert('key', 'a'), 0);
    assert.equal(await client.arInsert('key', 'b'), 1);
    assert.equal(await client.arInsert('key', 'c'), 2);
    assert.equal(await client.arGet('key', 0), 'a');
    assert.equal(await client.arGet('key', 1), 'b');
    assert.equal(await client.arGet('key', 2), 'c');
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arInsert overflows when cursor at MaxValue', async client => {
    assert.equal(await client.arInsert('key', 'a'), 0);
    // seek to ulong MaxValue
    assert.equal(await client.arSeek('key', '18446744073709551615'), 1);
    assert.equal(await client.arNext('key'), null);
    await assert.rejects(() => client.arInsert('key', 'b'), /insert index overflow/i);
  }, GLOBAL.SERVERS.OPEN);
});
