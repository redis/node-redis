import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import FUNCTION_STATS from './FUNCTION_STATS';
import { parseArgs } from './generic-transformers';
import { loadMathFunction, MATH_FUNCTION } from './FUNCTION_LOAD.spec';

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

  testUtils.testWithClient('structural assertion with loaded function', async client => {
    await loadMathFunction(client);
    const stats = await client.functionStats();

    // Structural assertion to catch RESP2 array vs RESP3 map differences
    assert.equal(stats.running_script, null);
    assert.ok(stats.engines);
    assert.equal(typeof stats.engines, 'object');
    assert.ok(!Array.isArray(stats.engines));

    // At least one engine (LUA) should exist with the loaded function
    const luaEngine = stats.engines['LUA'];
    assert.ok(luaEngine);

    // Deep structural check - ensures shape is {libraries_count: number, functions_count: number}
    assert.equal(Object.keys(luaEngine).length, 2);
    assert.ok('libraries_count' in luaEngine);
    assert.ok('functions_count' in luaEngine);
    assert.equal(typeof luaEngine.libraries_count, 'number');
    assert.equal(typeof luaEngine.functions_count, 'number');
    assert.ok(luaEngine.libraries_count >= 1);
    assert.ok(luaEngine.functions_count >= 1);
  }, GLOBAL.SERVERS.OPEN);
});
