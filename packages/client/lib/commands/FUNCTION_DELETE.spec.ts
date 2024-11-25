import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import FUNCTION_DELETE from './FUNCTION_DELETE';
import { MATH_FUNCTION, loadMathFunction } from './FUNCTION_LOAD.spec';
import { parseArgs } from './generic-transformers';

describe('FUNCTION DELETE', () => {
  testUtils.isVersionGreaterThanHook([7]);

  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(FUNCTION_DELETE, 'library'),
      ['FUNCTION', 'DELETE', 'library']
    );
  });

  testUtils.testWithClient('client.functionDelete', async client => {
    await loadMathFunction(client);

    assert.equal(
      await client.functionDelete(MATH_FUNCTION.name),
      'OK'
    );
  }, GLOBAL.SERVERS.OPEN);
});
