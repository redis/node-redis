import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ARSCAN from './ARSCAN';
import { parseArgs } from './generic-transformers';

describe('ARSCAN', () => {
  describe('transformArguments', () => {
    it('without options', () => {
      assert.deepEqual(
        parseArgs(ARSCAN, 'key', 0, 10),
        ['ARSCAN', 'key', '0', '10']
      );
    });

    it('with LIMIT', () => {
      assert.deepEqual(
        parseArgs(ARSCAN, 'key', 0, 10, { LIMIT: 2 }),
        ['ARSCAN', 'key', '0', '10', 'LIMIT', '2']
      );
    });
  });

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arScan sparse', async client => {
    assert.equal(await client.arMSet('key', [[0, 'a'], [5, 'b'], [9, 'c']]), 3);
    assert.deepEqual(await client.arScan('key', 0, 10), [
      { index: 0, value: 'a' },
      { index: 5, value: 'b' },
      { index: 9, value: 'c' }
    ]);
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arScan empty range returns empty array', async client => {
    assert.equal(await client.arSet('key', 500, 'x'), 1);
    assert.deepEqual(await client.arScan('key', 0, 100), []);
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arScan reverse range', async client => {
    assert.equal(await client.arMSet('key', [[0, 'a'], [5, 'b']]), 2);
    assert.deepEqual(await client.arScan('key', 5, 0), [
      { index: 5, value: 'b' },
      { index: 0, value: 'a' }
    ]);
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arScan missing key returns empty', async client => {
    assert.deepEqual(await client.arScan('missing', 0, 100), []);
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arScan mixed value types stringify', async client => {
    assert.equal(await client.arMSet('key', [[0, 'string'], [1, '12345'], [2, '3.14']]), 3);
    assert.deepEqual(await client.arScan('key', 0, 10), [
      { index: 0, value: 'string' },
      { index: 1, value: '12345' },
      { index: 2, value: '3.14' }
    ]);
  }, GLOBAL.SERVERS.OPEN);
});
