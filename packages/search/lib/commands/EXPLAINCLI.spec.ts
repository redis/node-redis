import { strict as assert } from 'node:assert';
import EXPLAINCLI from './EXPLAINCLI';

describe('EXPLAINCLI', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      EXPLAINCLI.transformArguments('index', '*'),
      ['FT.EXPLAINCLI', 'index', '*']
    );
  });
});
