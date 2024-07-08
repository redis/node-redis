import { strict as assert } from 'node:assert';
import CLIENT_GETREDIR from './CLIENT_GETREDIR';
import { parseArgs } from './generic-transformers';

describe('CLIENT GETREDIR', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(CLIENT_GETREDIR),
      ['CLIENT', 'GETREDIR']
    );
  });
});
