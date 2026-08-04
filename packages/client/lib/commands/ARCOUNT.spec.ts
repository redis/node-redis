import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ARCOUNT from './ARCOUNT';
import { parseArgs } from './generic-transformers';

describe('ARCOUNT', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(ARCOUNT, 'key'),
      ['ARCOUNT', 'key']
    );
  });

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arCount', async client => {
    await client.arSet('key', 0, ['v0', 'v1', 'v2']);
    assert.equal(
      await client.arCount('key'),
      3
    );
  }, GLOBAL.SERVERS.OPEN);
});
