import { strict as assert } from 'assert';
import READONLY from './READONLY';

describe('READONLY', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      READONLY.transformArguments(),
      ['READONLY']
    );
  });
});
