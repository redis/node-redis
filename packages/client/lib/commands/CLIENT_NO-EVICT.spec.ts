import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import CLIENT_NO_EVICT from './CLIENT_NO-EVICT';
import { parseArgs } from './generic-transformers';

describe('CLIENT NO-EVICT', () => {
  testUtils.isVersionGreaterThanHook([7]);

  describe('transformArguments', () => {
    it('true', () => {
      assert.deepEqual(
        parseArgs(CLIENT_NO_EVICT, true),
        ['CLIENT', 'NO-EVICT', 'ON']
      );
    });

    it('false', () => {
      assert.deepEqual(
        parseArgs(CLIENT_NO_EVICT, false),
        ['CLIENT', 'NO-EVICT', 'OFF']
      );
    });
  });

  testUtils.testWithClient('client.clientNoEvict', async client => {
    assert.equal(
      await client.clientNoEvict(true),
      'OK'
    );
  }, GLOBAL.SERVERS.OPEN);
});
