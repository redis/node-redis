import { strict as assert } from 'node:assert';
import CONFIG_RESETSTAT from './CONFIG_RESETSTAT';

describe('CONFIG RESETSTAT', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      CONFIG_RESETSTAT.transformArguments(),
      ['CONFIG', 'RESETSTAT']
    );
  });
});
