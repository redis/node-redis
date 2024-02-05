import { strict as assert } from 'node:assert';
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
    const [,, reply] = await Promise.all([
      loadMathFunction(client),
      client.set('key', '2'),
      client.fCall(MATH_FUNCTION.library.square.NAME, {
        keys: ['key']
      })
    ]);

    assert.equal(reply, 4);
  }, GLOBAL.SERVERS.OPEN);
});
