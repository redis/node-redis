import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SETBIT from './SETBIT';
import { parseArgs } from './generic-transformers';

describe('SETBIT', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(SETBIT, 'key', 0, 1),
      ['SETBIT', 'key', '0', '1']
    );
  });

  testUtils.testAll('setBit', async client => {
    assert.equal(
      await client.setBit('key', 0, 1),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
