import { strict as assert } from 'node:assert';
import READWRITE from './READWRITE';
import { parseArgs } from './generic-transformers';

describe('READWRITE', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(READWRITE),
      ['READWRITE']
    );
  });
});
