import { strict as assert } from 'node:assert';
import READONLY from './READONLY';

describe('READONLY', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      READONLY.transformArguments(),
      ['READONLY']
    );
  });
});
