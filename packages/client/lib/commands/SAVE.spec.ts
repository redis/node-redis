import { strict as assert } from 'node:assert';
import SAVE from './SAVE';
import { parseArgs } from './generic-transformers';

describe('SAVE', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(SAVE),
      ['SAVE']
    );
  });
});
