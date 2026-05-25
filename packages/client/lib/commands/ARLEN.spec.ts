import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ARLEN from './ARLEN';
import { parseArgs } from './generic-transformers';

describe('ARLEN', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(ARLEN, 'key'),
      ['ARLEN', 'key']
    );
  });

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arLen/arCount with sparse gaps', async client => {
    // missing key → 0 for both
    assert.equal(await client.arLen('key'), 0);
    assert.equal(await client.arCount('key'), 0);

    // length = highest_index + 1; count = filled cells
    assert.equal(await client.arSet('key', 0, 'a'), 1);
    assert.equal(await client.arLen('key'), 1);
    assert.equal(await client.arCount('key'), 1);

    assert.equal(await client.arSet('key', 5, 'b'), 1);
    assert.equal(await client.arLen('key'), 6);
    assert.equal(await client.arCount('key'), 2);

    assert.equal(await client.arSet('key', 100, 'c'), 1);
    assert.equal(await client.arLen('key'), 101);
    assert.equal(await client.arCount('key'), 3);

    // very wide sparse gaps
    await client.del('key');
    await client.arSet('key', 0, 'a');
    await client.arSet('key', 10000, 'b');
    await client.arSet('key', 1000000, 'c');

    assert.equal(await client.arGet('key', 0), 'a');
    assert.equal(await client.arGet('key', 10000), 'b');
    assert.equal(await client.arGet('key', 1000000), 'c');
    assert.equal(await client.arCount('key'), 3);
    assert.equal(await client.arLen('key'), 1000001);
  }, GLOBAL.SERVERS.OPEN);
});
