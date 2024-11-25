import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import RPOP_COUNT from './RPOP_COUNT';
import { parseArgs } from './generic-transformers';

describe('RPOP COUNT', () => {
  testUtils.isVersionGreaterThanHook([6, 2]);

  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(RPOP_COUNT, 'key', 1),
      ['RPOP', 'key', '1']
    );
  });

  testUtils.testAll('rPopCount', async client => {
    assert.equal(
      await client.rPopCount('key', 1),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
