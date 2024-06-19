import { strict as assert } from 'node:assert';
import RESTORE_ASKING from './RESTORE-ASKING';
import { parseArgs } from './generic-transformers';

describe('RESTORE-ASKING', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(RESTORE_ASKING),
      ['RESTORE-ASKING']
    );
  });
});
