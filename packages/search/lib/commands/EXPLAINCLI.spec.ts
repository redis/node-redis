import { strict as assert } from 'node:assert';
import EXPLAINCLI from './EXPLAINCLI';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('EXPLAINCLI', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(EXPLAINCLI, 'index', '*'),
      ['FT.EXPLAINCLI', 'index', '*']
    );
  });
});
