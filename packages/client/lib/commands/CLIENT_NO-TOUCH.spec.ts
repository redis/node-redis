import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import CLIENT_NO_TOUCH from './CLIENT_NO-TOUCH';
import { parseArgs } from './generic-transformers';

describe('CLIENT NO-TOUCH', () => {
  testUtils.isVersionGreaterThanHook([7, 2]);

  describe('transformArguments', () => {
    it('true', () => {
      assert.deepEqual(
        parseArgs(CLIENT_NO_TOUCH, true),
        ['CLIENT', 'NO-TOUCH', 'ON']
      );
    });

    it('false', () => {
      assert.deepEqual(
        parseArgs(CLIENT_NO_TOUCH, false),
        ['CLIENT', 'NO-TOUCH', 'OFF']
      );
    });
  });

  testUtils.testWithClient('client.clientNoTouch', async client => {
    assert.equal(
      await client.clientNoTouch(true),
      'OK'
    );
  }, GLOBAL.SERVERS.OPEN);
});
