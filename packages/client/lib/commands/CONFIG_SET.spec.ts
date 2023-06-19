import { strict as assert } from 'assert';
import CONFIG_SET from './CONFIG_SET';

describe('CONFIG SET', () => {
  describe('transformArguments', () => {
    it('set one parameter (old version)', () => {
      assert.deepEqual(
        CONFIG_SET.transformArguments('parameter', 'value'),
        ['CONFIG', 'SET', 'parameter', 'value']
      );
    });

    it('set muiltiple parameters', () => {
      assert.deepEqual(
        CONFIG_SET.transformArguments({
          1: 'a',
          2: 'b',
          3: 'c'
        }),
        ['CONFIG', 'SET', '1', 'a', '2', 'b', '3', 'c']
      );
    });
  });
});
