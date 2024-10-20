import { strict as assert } from 'node:assert';
import READONLY from './READONLY';
import { parseArgs } from './generic-transformers';

describe('READONLY', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(READONLY),
      ['READONLY']
    );
  });
});
