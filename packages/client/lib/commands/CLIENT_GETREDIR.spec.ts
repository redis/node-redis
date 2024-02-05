import { strict as assert } from 'node:assert';
import CLIENT_GETREDIR from './CLIENT_GETREDIR';

describe('CLIENT GETREDIR', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      CLIENT_GETREDIR.transformArguments(),
      ['CLIENT', 'GETREDIR']
    );
  });
});
