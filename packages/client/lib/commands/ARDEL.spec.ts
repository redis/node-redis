import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ARDEL from './ARDEL';
import { parseArgs } from './generic-transformers';

describe('ARDEL', () => {
  describe('transformArguments', () => {
    it('single index', () => {
      assert.deepEqual(
        parseArgs(ARDEL, 'key', 0),
        ['ARDEL', 'key', '0']
      );
    });

    it('multiple indices', () => {
      assert.deepEqual(
        parseArgs(ARDEL, 'key', [0, 2, 4]),
        ['ARDEL', 'key', '0', '2', '4']
      );
    });
  });

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arDel single index', async client => {
    assert.equal(await client.arSet('key', 0, ['a', 'b', 'c']), 3);
    assert.equal(await client.arDel('key', 1), 1);
    assert.equal(await client.arGet('key', 1), null);
    assert.equal(await client.arCount('key'), 2);
    // already deleted → 0
    assert.equal(await client.arDel('key', 1), 0);
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arDel multiple indices', async client => {
    assert.equal(await client.arSet('key', 0, ['a', 'b', 'c', 'd']), 4);
    assert.equal(await client.arDel('key', [0, 1, 2]), 3);
    assert.equal(await client.arCount('key'), 1);
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arDel last element removes the key', async client => {
    assert.equal(await client.arSet('key', 0, 'a'), 1);
    assert.equal(await client.arDel('key', 0), 1);
    assert.equal(await client.exists('key'), 0);
  }, GLOBAL.SERVERS.OPEN);
});
