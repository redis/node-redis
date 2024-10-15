import { strict as assert } from 'node:assert';
import MODULE_LIST from './MODULE_LIST';

describe('MODULE LIST', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      MODULE_LIST.transformArguments(),
      ['MODULE', 'LIST']
    );
  });
});
