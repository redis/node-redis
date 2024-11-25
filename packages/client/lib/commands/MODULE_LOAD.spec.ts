import { strict as assert } from 'node:assert';
import MODULE_LOAD from './MODULE_LOAD';
import { parseArgs } from './generic-transformers';

describe('MODULE LOAD', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(MODULE_LOAD, 'path'),
        ['MODULE', 'LOAD', 'path']
      );
    });

    it('with module args', () => {
      assert.deepEqual(
        parseArgs(MODULE_LOAD, 'path', ['1', '2']),
        ['MODULE', 'LOAD', 'path', '1', '2']
      );
    });
  });
});
