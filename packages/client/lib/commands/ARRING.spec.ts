import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ARRING from './ARRING';
import { parseArgs } from './generic-transformers';

describe('ARRING', () => {
  describe('transformArguments', () => {
    it('single value', () => {
      assert.deepEqual(
        parseArgs(ARRING, 'key', 3, 'v0'),
        ['ARRING', 'key', '3', 'v0']
      );
    });

    it('multiple values', () => {
      assert.deepEqual(
        parseArgs(ARRING, 'key', 4, ['v0', 'v1', 'v2']),
        ['ARRING', 'key', '4', 'v0', 'v1', 'v2']
      );
    });
  });

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arRing', async client => {
    assert.equal(
      await client.arRing('key', 4, ['v0', 'v1', 'v2']),
      2
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arRing wraps when full', async client => {
    await client.arRing('key', 3, ['v0', 'v1', 'v2']);
    assert.equal(
      await client.arRing('key', 3, 'v3'),
      0
    );
    assert.equal(await client.arGet('key', 0), 'v3');
    assert.equal(await client.arGet('key', 1), 'v1');
    assert.equal(await client.arGet('key', 2), 'v2');
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arRing keeps last `maxLength` values', async client => {
    for (let i = 0; i < 10; i++) await client.arRing('key', 5, i.toString());
    assert.equal(await client.arGet('key', 0), '5');
    assert.equal(await client.arGet('key', 1), '6');
    assert.equal(await client.arGet('key', 2), '7');
    assert.equal(await client.arGet('key', 3), '8');
    assert.equal(await client.arGet('key', 4), '9');
    assert.equal(await client.arCount('key'), 5);
  }, GLOBAL.SERVERS.OPEN);
});
