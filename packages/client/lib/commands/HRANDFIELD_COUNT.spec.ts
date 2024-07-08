import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import HRANDFIELD_COUNT from './HRANDFIELD_COUNT';
import { parseArgs } from './generic-transformers';

describe('HRANDFIELD COUNT', () => {
  testUtils.isVersionGreaterThanHook([6, 2, 5]);

  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(HRANDFIELD_COUNT, 'key', 1),
      ['HRANDFIELD', 'key', '1']
    );
  });

  testUtils.testAll('hRandFieldCount', async client => {
    assert.deepEqual(
      await client.hRandFieldCount('key', 1),
      []
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
