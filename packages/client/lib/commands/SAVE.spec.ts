import { strict as assert } from 'assert';
import SAVE from './SAVE';

describe('SAVE', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      SAVE.transformArguments(),
      ['SAVE']
    );
  });
});
