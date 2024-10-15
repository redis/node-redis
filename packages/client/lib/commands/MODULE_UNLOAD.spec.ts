import { strict as assert } from 'node:assert';
import MODULE_UNLOAD from './MODULE_UNLOAD';

describe('MODULE UNLOAD', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      MODULE_UNLOAD.transformArguments('name'),
      ['MODULE', 'UNLOAD', 'name']
    );
  });
});
