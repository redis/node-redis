import { strict as assert } from 'node:assert';
import MODULE_LIST from './MODULE_LIST';
import { parseArgs } from './generic-transformers';

describe('MODULE LIST', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(MODULE_LIST),
      ['MODULE', 'LIST']
    );
  });
});
