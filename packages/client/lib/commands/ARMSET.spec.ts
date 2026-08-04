import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ARMSET from './ARMSET';
import { parseArgs } from './generic-transformers';

describe('ARMSET', () => {
  describe('transformArguments', () => {
    it('object', () => {
      assert.deepEqual(
        parseArgs(ARMSET, 'key', { 0: 'v0', 2: 'v2', 4: 'v4' }),
        ['ARMSET', 'key', '0', 'v0', '2', 'v2', '4', 'v4']
      );
    });

    it('Map', () => {
      assert.deepEqual(
        parseArgs(ARMSET, 'key', new Map<number, string>([[0, 'v0'], [2, 'v2']])),
        ['ARMSET', 'key', '0', 'v0', '2', 'v2']
      );
    });

    it('tuples', () => {
      assert.deepEqual(
        parseArgs(ARMSET, 'key', [[0, 'v0'], [2, 'v2']]),
        ['ARMSET', 'key', '0', 'v0', '2', 'v2']
      );
    });
  });

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arMSet returns newly-filled count', async client => {
    assert.equal(await client.arMSet('key', [[0, 'a'], [1, 'b'], [2, 'c']]), 3);
    assert.equal(await client.arGet('key', 0), 'a');
    assert.equal(await client.arGet('key', 1), 'b');
    assert.equal(await client.arGet('key', 2), 'c');
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arMSet only counts newly-filled cells', async client => {
    // pre-fill index 0
    assert.equal(await client.arSet('key', 0, 'a'), 1);
    // overwrite 0 (not new) + write new 1 → count of newly filled = 1
    assert.equal(await client.arMSet('key', [[0, 'aa'], [1, 'b']]), 1);
    assert.equal(await client.arGet('key', 0), 'aa');
    assert.equal(await client.arGet('key', 1), 'b');
  }, GLOBAL.SERVERS.OPEN);
});
