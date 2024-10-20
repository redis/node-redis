import { strict as assert } from 'node:assert';
import testUtils from '../test-utils';
import FUNCTION_KILL from './FUNCTION_KILL';
import { parseArgs } from './generic-transformers';

describe('FUNCTION KILL', () => {
  testUtils.isVersionGreaterThanHook([7]);

  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(FUNCTION_KILL),
      ['FUNCTION', 'KILL']
    );
  });
});
