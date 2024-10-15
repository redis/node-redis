import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import CLIENT_NO_TOUCH from './CLIENT_NO-TOUCH';

describe('CLIENT NO-TOUCH', () => {
  testUtils.isVersionGreaterThanHook([7, 2]);

  describe('transformArguments', () => {
    it('true', () => {
      assert.deepEqual(
        CLIENT_NO_TOUCH.transformArguments(true),
        ['CLIENT', 'NO-TOUCH', 'ON']
      );
    });

    it('false', () => {
      assert.deepEqual(
        CLIENT_NO_TOUCH.transformArguments(false),
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
