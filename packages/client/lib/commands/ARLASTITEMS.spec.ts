import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ARLASTITEMS from './ARLASTITEMS';
import { parseArgs } from './generic-transformers';

describe('ARLASTITEMS', () => {
  describe('transformArguments', () => {
    it('without options', () => {
      assert.deepEqual(
        parseArgs(ARLASTITEMS, 'key', 3),
        ['ARLASTITEMS', 'key', '3']
      );
    });

    it('with REV', () => {
      assert.deepEqual(
        parseArgs(ARLASTITEMS, 'key', 3, { REV: true }),
        ['ARLASTITEMS', 'key', '3', 'REV']
      );
    });
  });

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arLastItems', async client => {
    await client.arInsert('key', ['v0', 'v1', 'v2', 'v3', 'v4']);
    assert.deepEqual(
      await client.arLastItems('key', 3),
      ['v2', 'v3', 'v4']
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arLastItems REV', async client => {
    await client.arInsert('key', ['v0', 'v1', 'v2', 'v3', 'v4']);
    assert.deepEqual(
      await client.arLastItems('key', 3, { REV: true }),
      ['v4', 'v3', 'v2']
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arLastItems still references tail after seek 0', async client => {
    for (let i = 0; i < 5; i++) await client.arInsert('key', (i * 10).toString());
    assert.deepEqual(await client.arLastItems('key', 3), ['20', '30', '40']);
    assert.deepEqual(await client.arLastItems('key', 3, { REV: true }), ['40', '30', '20']);

    // Seek to 0 rewinds the write cursor — but ARLASTITEMS still references the tail.
    assert.equal(await client.arSeek('key', 0), 1);
    assert.deepEqual(await client.arLastItems('key', 3), ['20', '30', '40']);
    assert.deepEqual(await client.arLastItems('key', 3, { REV: true }), ['40', '30', '20']);
  }, GLOBAL.SERVERS.OPEN);
});
