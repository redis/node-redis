import { strict as assert } from 'node:assert';
import EXPLAINCLI from './EXPLAINCLI';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';
import { DEFAULT_DIALECT } from '../dialect/default';

describe('EXPLAINCLI', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(EXPLAINCLI, 'index', '*'),
      ['FT.EXPLAINCLI', 'index', '*', 'DIALECT', DEFAULT_DIALECT]
    );
  });

  it('with dialect', () => {
    assert.deepEqual(
      parseArgs(EXPLAINCLI, 'index', '*', {DIALECT: 1}),
      ['FT.EXPLAINCLI', 'index', '*', 'DIALECT', '1']
    );
  });
});
