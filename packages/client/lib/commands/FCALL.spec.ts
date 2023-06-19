import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { MATH_FUNCTION, loadMathFunction } from './FUNCTION_LOAD.spec';
import FCALL from './FCALL';

describe('FCALL', () => {
  testUtils.isVersionGreaterThanHook([7]);

  it('transformArguments', () => {
    assert.deepEqual(
      FCALL.transformArguments('function', {
        keys: ['key'],
        arguments: ['argument']
      }),
      ['FCALL', 'function', '1', 'key', 'argument']
    );
  });

  testUtils.testWithClient('client.fCall', async client => {
    await loadMathFunction(client);

    assert.equal(
      await client.fCall(MATH_FUNCTION.library.square.NAME, {
        arguments: ['2']
      }),
      4
    );
  }, GLOBAL.SERVERS.OPEN);
});
