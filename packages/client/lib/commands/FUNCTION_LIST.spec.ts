import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import FUNCTION_LIST from './FUNCTION_LIST';
import { MATH_FUNCTION, loadMathFunction } from './FUNCTION_LOAD.spec';
import { parseArgs } from './generic-transformers';

describe('FUNCTION LIST', () => {
  testUtils.isVersionGreaterThanHook([7]);

  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(FUNCTION_LIST),
        ['FUNCTION', 'LIST']
      );
    });

    it('with LIBRARYNAME', () => {
      assert.deepEqual(
        parseArgs(FUNCTION_LIST, {
          LIBRARYNAME: 'patter*'
        }),
        ['FUNCTION', 'LIST', 'LIBRARYNAME', 'patter*']
      );
    });
  });

  testUtils.testWithClient('client.functionList', async client => {
    const [, reply] = await Promise.all([
      loadMathFunction(client),
      client.functionList()
    ]);

    reply[0].library_name;

    assert.deepEqual(reply, [{
      library_name: MATH_FUNCTION.name,
      engine: MATH_FUNCTION.engine,
      functions: [{
        name: MATH_FUNCTION.library.square.NAME,
        description: null,
        flags: ['no-writes']
      }]
    }]);
  }, GLOBAL.SERVERS.OPEN);
});
