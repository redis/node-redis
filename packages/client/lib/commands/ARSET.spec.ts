import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ARSET from './ARSET';
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

    // numeric / float / long / empty-string values round-trip as strings
    assert.equal(await client.arSet('key', 10, '12345'), 1);
    assert.equal(await client.arGet('key', 10), '12345');

    assert.equal(await client.arSet('key', 11, '3.14159'), 1);
    assert.equal(await client.arGet('key', 11), '3.14159');

    assert.equal(await client.arSet('key', 12, 'abc'), 1);
    assert.equal(await client.arGet('key', 12), 'abc');

    const longString = 'x'.repeat(100);
    assert.equal(await client.arSet('key', 13, longString), 1);
    assert.equal(await client.arGet('key', 13), longString);

    assert.equal(await client.arSet('key', 14, ''), 1);
    assert.equal(await client.arGet('key', 14), '');
  }, GLOBAL.SERVERS.OPEN);
});
