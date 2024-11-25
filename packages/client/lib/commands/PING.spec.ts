import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import PING from './PING';
import { parseArgs } from './generic-transformers';

describe('PING', () => {
  describe('transformArguments', () => {
    it('default', () => {
      assert.deepEqual(
        parseArgs(PING),
        ['PING']
      );
    });

    it('with message', () => {
      assert.deepEqual(
        parseArgs(PING, 'message'),
        ['PING', 'message']
      );
    });
  });

  testUtils.testAll('ping', async client => {
    assert.equal(
      await client.ping(),
      'PONG'
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
