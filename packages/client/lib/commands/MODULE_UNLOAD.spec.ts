import { strict as assert } from 'node:assert';
import MODULE_UNLOAD from './MODULE_UNLOAD';
import { parseArgs } from './generic-transformers';

describe('MODULE UNLOAD', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(MODULE_UNLOAD, 'name'),
      ['MODULE', 'UNLOAD', 'name']
    );
  });
});
