import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ARINFO from './ARINFO';
import { parseArgs } from './generic-transformers';

describe('ARINFO', () => {
  describe('transformArguments', () => {
    it('without options', () => {
      assert.deepEqual(
        parseArgs(ARINFO, 'key'),
        ['ARINFO', 'key']
      );
    });

    it('with FULL', () => {
      assert.deepEqual(
        parseArgs(ARINFO, 'key', { FULL: true }),
        ['ARINFO', 'key', 'FULL']
      );
    });
  });

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arInfo returns expected fields', async client => {
    assert.equal(await client.arMSet('key', [[0, 'a'], [1, 'b'], [100, 'c']]), 3);
    const info = await client.arInfo('key') as Record<string, number>;
    assert.equal(info['count'], 3);
    assert.equal(info['len'], 101);
    assert.equal(info['next-insert-index'], 0);
    assert.equal(info['slices'], 1);
    assert.equal(info['directory-size'], 1);
    assert.equal(info['super-dir-entries'], 0);
    assert.equal(info['slice-size'], 4096);
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'array TYPE and OBJECT ENCODING', async client => {
    assert.equal(await client.arSet('key', 0, 'hello'), 1);
    assert.equal(await client.type('key'), 'array');
    assert.equal(await client.objectEncoding('key'), 'sliced-array');
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'AR* commands reject non-array keys (WRONGTYPE)', async client => {
    await client.set('key', 'value');
    await assert.rejects(() => client.arGet('key', 0), /WRONGTYPE/i);
    await assert.rejects(() => client.arSet('key', 0, 'foo'), /WRONGTYPE/i);
    await assert.rejects(() => client.arLen('key'), /WRONGTYPE/i);
    await assert.rejects(() => client.arCount('key'), /WRONGTYPE/i);
  }, GLOBAL.SERVERS.OPEN);
});
