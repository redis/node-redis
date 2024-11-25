import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import FUNCTION_STATS from './FUNCTION_STATS';
import { parseArgs } from './generic-transformers';

describe('FUNCTION STATS', () => {
  testUtils.isVersionGreaterThanHook([7]);

  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(FUNCTION_STATS),
      ['FUNCTION', 'STATS']
    );
  });

  testUtils.testWithClient('client.functionStats', async client => {
    const stats = await client.functionStats();
    assert.equal(stats.running_script, null);
    assert.equal(typeof stats.engines, 'object');
    for (const [engine, { libraries_count, functions_count }] of Object.entries(stats.engines)) {
      assert.equal(typeof engine, 'string');
      assert.equal(typeof libraries_count, 'number');
      assert.equal(typeof functions_count, 'number');
    }
  }, GLOBAL.SERVERS.OPEN);
});
