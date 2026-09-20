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

    it('with an empty message', () => {
      assert.deepEqual(
        parseArgs(PING, ''),
        ['PING', '']
      );
    });
  });

  testUtils.testAll('ping', async client => {
    assert.equal(
      await client.ping(),
      'PONG'
    );

    assert.equal(
      await client.ping(''),
      ''
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
