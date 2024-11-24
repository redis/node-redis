import { strict as assert } from 'node:assert';
import CONFIG_REWRITE from './CONFIG_REWRITE';
import { parseArgs } from './generic-transformers';

describe('CONFIG REWRITE', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(CONFIG_REWRITE),
      ['CONFIG', 'REWRITE']
    );
  });
});
