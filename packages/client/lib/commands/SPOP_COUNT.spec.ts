import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SPOP_COUNT from './SPOP_COUNT';
import { parseArgs } from './generic-transformers';

describe('SPOP_COUNT', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(SPOP_COUNT, 'key', 1),
      ['SPOP', 'key', '1']
    );
  });

  testUtils.testAll('sPopCount', async client => {
    assert.deepEqual(
      await client.sPopCount('key', 1),
      []
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
