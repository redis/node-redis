import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SCRIPT_FLUSH from './SCRIPT_FLUSH';

describe('SCRIPT FLUSH', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        SCRIPT_FLUSH.transformArguments(),
        ['SCRIPT', 'FLUSH']
      );
    });

    it('with mode', () => {
      assert.deepEqual(
        SCRIPT_FLUSH.transformArguments('SYNC'),
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
