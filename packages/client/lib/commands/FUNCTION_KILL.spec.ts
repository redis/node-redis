import { strict as assert } from 'node:assert';
import testUtils from '../test-utils';
import FUNCTION_KILL from './FUNCTION_KILL';

describe('FUNCTION KILL', () => {
  testUtils.isVersionGreaterThanHook([7]);

  it('transformArguments', () => {
    assert.deepEqual(
      FUNCTION_KILL.transformArguments(),
      ['FUNCTION', 'KILL']
    );
  });
});
