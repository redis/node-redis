import { strict as assert } from 'node:assert';
import RESTORE_ASKING from './RESTORE-ASKING';

describe('RESTORE-ASKING', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      RESTORE_ASKING.transformArguments(),
      ['RESTORE-ASKING']
    );
  });
});
