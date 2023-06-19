import { strict as assert } from 'assert';
import CONFIG_GET from './CONFIG_GET';

describe('CONFIG GET', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      CONFIG_GET.transformArguments('*'),
      ['CONFIG', 'GET', '*']
    );
  });
});
