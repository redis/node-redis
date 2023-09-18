import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import FUNCTION_DELETE from './FUNCTION_DELETE';
import { MATH_FUNCTION, loadMathFunction } from './FUNCTION_LOAD.spec';

describe('FUNCTION DELETE', () => {
  testUtils.isVersionGreaterThanHook([7]);

  it('transformArguments', () => {
    assert.deepEqual(
      FUNCTION_DELETE.transformArguments('library'),
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
