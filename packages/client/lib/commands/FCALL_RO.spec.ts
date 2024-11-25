import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import { MATH_FUNCTION, loadMathFunction } from './FUNCTION_LOAD.spec';
import FCALL_RO from './FCALL_RO';
import { parseArgs } from './generic-transformers';

describe('FCALL_RO', () => {
  testUtils.isVersionGreaterThanHook([7]);

  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(FCALL_RO, 'function', {
        keys: ['key'],
        arguments: ['argument']
      }),
      ['FCALL_RO', 'function', '1', 'key', 'argument']
    );
  });

  testUtils.testWithClient('client.fCallRo', async client => {
    const [,, reply] = await Promise.all([
      loadMathFunction(client),
      client.set('key', '2'),
      client.fCallRo(MATH_FUNCTION.library.square.NAME, {
        keys: ['key']
      })
    ]);

    assert.equal(reply, 4);
  }, GLOBAL.SERVERS.OPEN);
});
