import { strict as assert } from 'node:assert';
import SCRIPT_KILL from './SCRIPT_KILL';
import { parseArgs } from './generic-transformers';

describe('SCRIPT KILL', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(SCRIPT_KILL),
      ['SCRIPT', 'KILL']
    );
  });
});
