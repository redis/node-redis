import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import CLIENT_PAUSE from './CLIENT_PAUSE';
import { parseArgs } from './generic-transformers';

describe('CLIENT PAUSE', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(CLIENT_PAUSE, 0),
        ['CLIENT', 'PAUSE', '0']
      );
    });

    it('with mode', () => {
      assert.deepEqual(
        parseArgs(CLIENT_PAUSE, 0, 'ALL'),
        ['CLIENT', 'PAUSE', '0', 'ALL']
      );
    });
  });

  testUtils.testWithClient('client.clientPause', async client => {
    assert.equal(
      await client.clientPause(0),
      'OK'
    );
  }, GLOBAL.SERVERS.OPEN);
});
