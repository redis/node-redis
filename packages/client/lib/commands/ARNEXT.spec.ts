import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ARNEXT from './ARNEXT';
import { parseArgs } from './generic-transformers';

describe('ARNEXT', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(ARNEXT, 'key'),
      ['ARNEXT', 'key']
    );
  });

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arNext tracks insert cursor', async client => {
    // empty key starts at 0
    assert.equal(await client.arNext('key'), 0);
    assert.equal(await client.arInsert('key', 'a'), 0);
    assert.equal(await client.arNext('key'), 1);
    assert.equal(await client.arInsert('key', 'b'), 1);
    assert.equal(await client.arNext('key'), 2);
    // after seek, ARNEXT reflects the new cursor
    assert.equal(await client.arSeek('key', 10), 1);
    assert.equal(await client.arInsert('key', 'c'), 10);
    assert.equal(await client.arNext('key'), 11);
  }, GLOBAL.SERVERS.OPEN);
});
