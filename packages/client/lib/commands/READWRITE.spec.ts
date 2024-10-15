import { strict as assert } from 'node:assert';
import READWRITE from './READWRITE';

describe('READWRITE', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      READWRITE.transformArguments(),
      ['READWRITE']
    );
  });
});
