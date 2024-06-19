import { strict as assert } from 'node:assert';
import ASKING from './ASKING';
import { parseArgs } from './generic-transformers';

describe('ASKING', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(ASKING),
      ['ASKING']
    );
  });
});
