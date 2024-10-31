import { strict as assert } from 'node:assert';
import DISCARD from './DISCARD';
import { parseArgs } from './generic-transformers';

describe('DISCARD', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(DISCARD),
      ['DISCARD']
    );
  });
});
