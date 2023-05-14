import { strict as assert } from 'assert';
import READWRITE from './READWRITE';

describe('READWRITE', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      READWRITE.transformArguments(),
      ['READWRITE']
    );
  });
});
