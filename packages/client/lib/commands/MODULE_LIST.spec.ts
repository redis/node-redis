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
});
