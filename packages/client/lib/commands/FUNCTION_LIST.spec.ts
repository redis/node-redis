import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import FUNCTION_LIST from './FUNCTION_LIST';
import { MATH_FUNCTION, loadMathFunction } from './FUNCTION_LOAD.spec';

describe('FUNCTION LIST', () => {
  testUtils.isVersionGreaterThanHook([7]);

  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        FUNCTION_LIST.transformArguments(),
        ['FUNCTION', 'LIST']
      );
    });

    it('with LIBRARYNAME', () => {
      assert.deepEqual(
        FUNCTION_LIST.transformArguments({
          LIBRARYNAME: 'patter*'
        }),
        ['FUNCTION', 'LIST', 'LIBRARYNAME', 'patter*']
      );
    });
  });

  testUtils.testWithClient('client.functionList', async client => {
    await loadMathFunction(client);

    assert.deepEqual(
      await client.functionList(),
      [{
        library_name: MATH_FUNCTION.name,
        engine: MATH_FUNCTION.engine,
        functions: [{
          name: MATH_FUNCTION.library.square.NAME,
          description: null,
          flags: ['no-writes']
        }]
      }]
    );
  }, GLOBAL.SERVERS.OPEN);
});
