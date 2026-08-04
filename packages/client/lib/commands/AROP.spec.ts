import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import AROP from './AROP';
import { parseArgs } from './generic-transformers';

describe('AROP', () => {
  describe('transformArguments', () => {
    it('without value', () => {
      assert.deepEqual(
        parseArgs(AROP, 'key', 0, 4, 'SUM'),
        ['AROP', 'key', '0', '4', 'SUM']
      );
    });

    it('with value (MATCH)', () => {
      assert.deepEqual(
        parseArgs(AROP, 'key', 0, 4, 'MATCH', 2),
        ['AROP', 'key', '0', '4', 'MATCH', '2']
      );
    });
  });

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arOp SUM', async client => {
    assert.equal(await client.arMSet('key', [[0, '10'], [1, '20'], [2, '30']]), 3);
    assert.equal(await client.arOp('key', 0, 2, 'SUM'), '60');
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arOp MIN/MAX', async client => {
    assert.equal(await client.arMSet('key', [[0, '30'], [1, '10'], [2, '20']]), 3);
    assert.equal(await client.arOp('key', 0, 2, 'MIN'), '10');
    assert.equal(await client.arOp('key', 0, 2, 'MAX'), '30');
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arOp MATCH counts occurrences', async client => {
    assert.equal(await client.arMSet('key', [[0, 'hello'], [1, 'world'], [2, 'hello'], [3, 'foo']]), 4);
    assert.equal(await client.arOp('key', 0, 3, 'MATCH', 'hello'), 2);
    assert.equal(await client.arOp('key', 0, 3, 'MATCH', 'world'), 1);
    assert.equal(await client.arOp('key', 0, 3, 'MATCH', 'bar'), 0);
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arOp USED counts filled cells in range', async client => {
    assert.equal(await client.arMSet('key', [[0, 'a'], [2, 'b'], [5, 'c']]), 3);
    assert.equal(await client.arOp('key', 0, 10, 'USED'), 3);
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arOp bitwise AND/OR/XOR on integers', async client => {
    assert.equal(await client.arMSet('key', [[0, '255'], [1, '15'], [2, '240']]), 3);
    assert.equal(await client.arOp('key', 0, 2, 'AND'), 0);
    assert.equal(await client.arOp('key', 0, 2, 'OR'), 255);
    assert.equal(await client.arOp('key', 0, 2, 'XOR'), 0);
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arOp bitwise truncates floats toward zero', async client => {
    assert.equal(await client.arMSet('key', [[0, '7.9'], [1, '3.2'], [2, '1.8']]), 3);
    assert.equal(await client.arOp('key', 0, 2, 'AND'), 1); // 7 & 3 & 1
    assert.equal(await client.arOp('key', 0, 2, 'OR'), 7);  // 7 | 3 | 1
    assert.equal(await client.arOp('key', 0, 2, 'XOR'), 5); // 7 ^ 3 ^ 1
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arOp server validates operand presence', async client => {
    assert.equal(await client.arMSet('key', [[0, '10'], [1, '20']]), 2);
    // MATCH requires an operand
    await assert.rejects(() => client.arOp('key', 0, 1, 'MATCH'));
    // SUM rejects an operand
    await assert.rejects(() => client.arOp('key', 0, 1, 'SUM', 'value'));
  }, GLOBAL.SERVERS.OPEN);
});
