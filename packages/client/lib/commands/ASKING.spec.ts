import { strict as assert } from 'assert';
import ASKING from './ASKING';

describe('ASKING', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      ASKING.transformArguments(),
      ['ASKING']
    );
  });
});
