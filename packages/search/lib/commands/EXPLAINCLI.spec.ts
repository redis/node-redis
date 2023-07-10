import { strict as assert } from 'assert';
import EXPLAINCLI from './EXPLAINCLI';

describe('EXPLAINCLI', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      EXPLAINCLI.transformArguments('index', '*'),
      ['FT.EXPLAINCLI', 'index', '*']
    );
  });
});
