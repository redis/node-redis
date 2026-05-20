import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ARGET from './ARGET';
import { parseArgs } from './generic-transformers';

describe('ARGET', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(ARGET, 'key', 0),
      ['ARGET', 'key', '0']
    );
  });

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arGet', async client => {
    await client.arSet('key', 0, 'v0');
    assert.equal(
      await client.arGet('key', 0),
      'v0'
    );
  }, GLOBAL.SERVERS.OPEN);
});
