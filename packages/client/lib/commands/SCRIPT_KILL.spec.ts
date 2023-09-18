import { strict as assert } from 'node:assert';
import SCRIPT_KILL from './SCRIPT_KILL';

describe('SCRIPT KILL', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      SCRIPT_KILL.transformArguments(),
      ['SCRIPT', 'KILL']
    );
  });
});
