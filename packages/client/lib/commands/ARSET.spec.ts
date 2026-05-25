import { strict as assert } from 'node:assert';
import { randomBytes } from 'node:crypto';
import testUtils, { GLOBAL } from '../test-utils';
import ARSET from './ARSET';
import { RESP_TYPES } from '../RESP/decoder';
import { parseArgs } from './generic-transformers';

describe('ARSET', () => {
  describe('transformArguments', () => {
    it('single value', () => {
      assert.deepEqual(
        parseArgs(ARSET, 'key', 0, 'v0'),
        ['ARSET', 'key', '0', 'v0']
      );
    });

    it('multiple values', () => {
      assert.deepEqual(
        parseArgs(ARSET, 'key', 0, ['v0', 'v1', 'v2']),
        ['ARSET', 'key', '0', 'v0', 'v1', 'v2']
      );
    });
  });

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arSet/arGet basics', async client => {
    // first set returns 1 (newly filled), get returns the value, unset index returns null
    assert.equal(await client.arSet('key', 0, 'hello'), 1);
    assert.equal(await client.arGet('key', 0), 'hello');
    assert.equal(await client.arGet('key', 1), null);

    // overwrite returns 0 (already filled)
    assert.equal(await client.arSet('key', 0, 'world'), 0);
    assert.equal(await client.arGet('key', 0), 'world');

    // missing key
    assert.equal(await client.arGet('missing', 0), null);

    // numeric value (coerced to string) round-trips
    assert.equal(await client.arSet('key', 10, (12345).toString()), 1);
    assert.equal(await client.arGet('key', 10), '12345');

    // empty string
    assert.equal(await client.arSet('key', 11, ''), 1);
    assert.equal(await client.arGet('key', 11), '');

    // random bytes survive round-trip when read back as Buffer
    const bytes = randomBytes(64);
    assert.equal(await client.arSet('key', 12, bytes), 1);
    assert.deepEqual(
      await client.withTypeMapping({ [RESP_TYPES.BLOB_STRING]: Buffer }).arGet('key', 12),
      bytes
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arSet with multiple values returns count of newly-filled slots', async client => {
    // 3 brand-new slots at 0,1,2 -> 3
    assert.equal(await client.arSet('multi', 0, ['a', 'b', 'c']), 3);
    // overwrite the same 3 slots -> 0
    assert.equal(await client.arSet('multi', 0, ['x', 'y', 'z']), 0);
    // starts at 2 (filled), extends to 3,4 (new) -> 2
    assert.equal(await client.arSet('multi', 2, ['p', 'q', 'r']), 2);
  }, GLOBAL.SERVERS.OPEN);
});
