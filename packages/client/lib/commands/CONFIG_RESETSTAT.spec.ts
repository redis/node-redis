import { strict as assert } from 'node:assert';
import CONFIG_RESETSTAT from './CONFIG_RESETSTAT';
import { parseArgs } from './generic-transformers';

describe('CONFIG RESETSTAT', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(CONFIG_RESETSTAT),
      ['CONFIG', 'RESETSTAT']
    );
  });
});
