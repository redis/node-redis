import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import { MATH_FUNCTION, loadMathFunction } from './FUNCTION_LOAD.spec';
import FCALL_RO from './FCALL_RO';

describe('FCALL_RO', () => {
  testUtils.isVersionGreaterThanHook([7]);

  it('transformArguments', () => {
    assert.deepEqual(
      FCALL_RO.transformArguments('function', {
        keys: ['key'],
        arguments: ['argument']
      }),
      ['FCALL_RO', 'function', '1', 'key', 'argument']
    );
  });

  testUtils.testWithClient('client.fCallRo', async client => {
    await loadMathFunction(client);

    assert.equal(
      await client.fCallRo(MATH_FUNCTION.library.square.NAME, {
        arguments: ['2']
      }),
      4
    );
  }, GLOBAL.SERVERS.OPEN);
});
