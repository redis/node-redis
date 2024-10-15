import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import FUNCTION_LIST_WITHCODE from './FUNCTION_LIST_WITHCODE';
import { MATH_FUNCTION, loadMathFunction } from './FUNCTION_LOAD.spec';
import { parseArgs } from './generic-transformers';

describe('FUNCTION LIST WITHCODE', () => {
  testUtils.isVersionGreaterThanHook([7]);

  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(FUNCTION_LIST_WITHCODE),
        ['FUNCTION', 'LIST', 'WITHCODE']
      );
    });

    it('with LIBRARYNAME', () => {
      assert.deepEqual(
        parseArgs(FUNCTION_LIST_WITHCODE, {
          LIBRARYNAME: 'patter*'
        }),
        ['FUNCTION', 'LIST', 'LIBRARYNAME', 'patter*', 'WITHCODE']
      );
    });
  });

  testUtils.testWithClient('client.functionListWithCode', async client => {
    const [, reply] = await Promise.all([
      loadMathFunction(client),
      client.functionListWithCode()
    ]);

    const a = reply[0];

    const b = a.functions[0].description;
    
    assert.deepEqual(reply, [{
      library_name: MATH_FUNCTION.name,
      engine: MATH_FUNCTION.engine,
      functions: [{
        name: MATH_FUNCTION.library.square.NAME,
        description: null,
        flags: ['no-writes']
      }],
      library_code: MATH_FUNCTION.code
    }]);
  }, GLOBAL.SERVERS.OPEN);
});
