import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ARDELRANGE from './ARDELRANGE';
import { parseArgs } from './generic-transformers';

describe('ARDELRANGE', () => {
  describe('transformArguments', () => {
    it('single range', () => {
      assert.deepEqual(
        parseArgs(ARDELRANGE, 'key', [[0, 4]]),
        ['ARDELRANGE', 'key', '0', '4']
      );
    });

    it('multiple ranges', () => {
      assert.deepEqual(
        parseArgs(ARDELRANGE, 'key', [[0, 1], [3, 4]]),
        ['ARDELRANGE', 'key', '0', '1', '3', '4']
      );
    });
  });

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arDelRange single range', async client => {
    for (let i = 0; i < 10; i++) await client.arSet('key', i, (i * 10).toString());
    assert.equal(await client.arCount('key'), 10);
    assert.equal(await client.arDelRange('key', [[2, 6]]), 5);
    assert.equal(await client.arCount('key'), 5);
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arDelRange reverse range', async client => {
    for (let i = 0; i < 10; i++) await client.arSet('key', i, (i * 10).toString());
    // start > end still deletes the same 5 elements
    assert.equal(await client.arDelRange('key', [[6, 2]]), 5);
    assert.equal(await client.arCount('key'), 5);
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arDelRange multiple ranges', async client => {
    assert.equal(await client.arSet('key', 0, ['a', 'b', 'c', 'd', 'e', 'f']), 6);
    assert.equal(await client.arDelRange('key', [[0, 1], [4, 5]]), 4);
    assert.deepEqual(
      await client.arGetRange('key', 0, 5),
      [null, null, 'c', 'd', null, null]
    );
  }, GLOBAL.SERVERS.OPEN);
});
