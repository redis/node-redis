import { strict as assert } from 'node:assert';
import ASKING from './ASKING';

describe('ASKING', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      ASKING.transformArguments(),
      ['ASKING']
    );
  });
});
