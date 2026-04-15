import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import MODULE_LIST from './MODULE_LIST';
import { parseArgs } from './generic-transformers';

describe('MODULE LIST', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(MODULE_LIST),
      ['MODULE', 'LIST']
    );
  });

  testUtils.testWithClient('client.moduleList', async client => {
    const reply = await client.moduleList();
    assert.ok(Array.isArray(reply));
    for (const module of reply) {
      assert.equal(typeof module.name, 'string');
      assert.equal(typeof module.ver, 'number');
    }
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('client.moduleList - structural assertion', async client => {
    const reply = await client.moduleList();
    // Strong structural assertion: reply must be an array of objects with exact shape
    assert.ok(Array.isArray(reply));
    for (const module of reply) {
      // Assert the exact structure: must be a plain object with 'name' and 'ver' properties
      assert.ok(typeof module === 'object' && module !== null);
      assert.ok('name' in module && 'ver' in module);
      assert.equal(typeof module.name, 'string');
      assert.equal(typeof module.ver, 'number');
      // Ensure it's a plain object (not a Map or other structure)
      assert.ok(!('entries' in module && typeof module.entries === 'function'));
      // Check that the object has exactly these two keys
      const keys = Object.keys(module).sort();
      assert.deepStrictEqual(keys, ['name', 'ver']);
    }
  }, GLOBAL.SERVERS.OPEN);
});
