import { strict as assert } from 'node:assert';
import MODULE_LOAD from './MODULE_LOAD';

describe('MODULE LOAD', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        MODULE_LOAD.transformArguments('path'),
        ['MODULE', 'LOAD', 'path']
      );
    });

    it('with module args', () => {
      assert.deepEqual(
        MODULE_LOAD.transformArguments('path', ['1', '2']),
        ['MODULE', 'LOAD', 'path', '1', '2']
      );
    });
  });
});
