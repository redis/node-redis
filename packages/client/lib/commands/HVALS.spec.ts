import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import HVALS from './HVALS';
import { parseArgs } from './generic-transformers';

describe('HVALS', () => {
  it('processCommand', () => {
    assert.deepEqual(
      parseArgs(HVALS, 'key'),
      ['HVALS', 'key']
    );
  });

  testUtils.testAll('hVals', async client => {
    assert.deepEqual(
      await client.hVals('key'),
      []
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
