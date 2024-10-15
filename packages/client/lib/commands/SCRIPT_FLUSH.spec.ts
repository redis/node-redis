import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SCRIPT_FLUSH from './SCRIPT_FLUSH';
import { parseArgs } from './generic-transformers';

describe('SCRIPT FLUSH', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(SCRIPT_FLUSH),
        ['SCRIPT', 'FLUSH']
      );
    });

    it('with mode', () => {
      assert.deepEqual(
        parseArgs(SCRIPT_FLUSH, 'SYNC'),
        ['SCRIPT', 'FLUSH', 'SYNC']
      );
    });
  });

  testUtils.testWithClient('client.scriptFlush', async client => {
    assert.equal(
      await client.scriptFlush(),
      'OK'
    );
  }, GLOBAL.SERVERS.OPEN);
});
