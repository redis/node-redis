import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import FUNCTION_FLUSH from './FUNCTION_FLUSH';
import { parseArgs } from './generic-transformers';

describe('FUNCTION FLUSH', () => {
  testUtils.isVersionGreaterThanHook([7]);

  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(FUNCTION_FLUSH),
        ['FUNCTION', 'FLUSH']
      );
    });

    it('with mode', () => {
      assert.deepEqual(
        parseArgs(FUNCTION_FLUSH, 'SYNC'),
        ['FUNCTION', 'FLUSH', 'SYNC']
      );
    });
  });

  testUtils.testWithClient('client.functionFlush', async client => {
    assert.equal(
      await client.functionFlush(),
      'OK'
    );
  }, GLOBAL.SERVERS.OPEN);
});
