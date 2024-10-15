import { strict as assert } from 'node:assert';
import DISCARD from './DISCARD';

describe('DISCARD', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      DISCARD.transformArguments(),
      ['DISCARD']
    );
  });
});
