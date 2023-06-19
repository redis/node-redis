import { strict as assert } from 'assert';
import DISCARD from './DISCARD';

describe('DISCARD', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      DISCARD.transformArguments(),
      ['DISCARD']
    );
  });
});
